import axios, { AxiosInstance, AxiosError } from 'axios';
import pRetry from 'p-retry';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type {
  IJudgeProvider,
  JudgeSubmissionRequest,
  JudgeResult,
  JudgeRunRequest,
  JudgeRunResult,
} from './types';
import type { SubmissionVerdict } from '@code-wars/shared';

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}

interface PistonExecuteRequest {
  language: string;
  version: string;
  files: Array<{
    name?: string;
    content: string;
  }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
  };
}

// Language ID mapping: Judge0 language IDs → Piston runtime identifiers
// This maintains backward compatibility with existing code using Judge0 language IDs
const LANGUAGE_MAP: Record<number, { language: string; version: string; aliases?: string[] }> = {
  // Common languages
  50: { language: 'c', version: '10.2.0', aliases: ['gcc'] },
  54: { language: 'cpp', version: '10.2.0', aliases: ['g++', 'c++'] },
  62: { language: 'java', version: '15.0.2' },
  63: { language: 'javascript', version: '18.15.0', aliases: ['node'] },
  71: { language: 'python', version: '3.10.0', aliases: ['py', 'python3'] },
  68: { language: 'php', version: '8.2.3' },
  51: { language: 'csharp', version: '6.12.0', aliases: ['c#', 'cs'] },
  60: { language: 'go', version: '1.16.2', aliases: ['golang'] },
  72: { language: 'ruby', version: '3.0.1' },
  73: { language: 'rust', version: '1.68.2' },
  78: { language: 'kotlin', version: '1.8.20' },
  82: { language: 'sql', version: '3.36.0', aliases: ['sqlite'] },
  83: { language: 'swift', version: '5.3.3' },
  74: { language: 'typescript', version: '5.0.3', aliases: ['ts'] },
};

/**
 * Normalizes output by trimming whitespace and handling line endings
 */
function normalizeOutput(output: string | null): string {
  if (!output) return '';
  return output.trim().replace(/\r\n/g, '\n');
}

/**
 * Compares actual output with expected output
 */
function compareOutputs(actual: string | null, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

/**
 * Maps Piston execution results to Code Wars verdicts
 */
function determineVerdict(
  response: PistonExecuteResponse,
  expectedOutput?: string,
): SubmissionVerdict {
  // Check for compilation errors first
  if (response.compile) {
    if (response.compile.code !== 0 || response.compile.signal !== null) {
      return 'COMPILATION_ERROR';
    }
  }

  // Check for runtime errors
  if (response.run.signal !== null) {
    // Process was killed by a signal (segfault, kill, etc.)
    return 'RUNTIME_ERROR';
  }

  if (response.run.code !== 0 && response.run.code !== null) {
    // Non-zero exit code indicates runtime error
    return 'RUNTIME_ERROR';
  }

  // If we have expected output, compare it
  if (expectedOutput !== undefined) {
    const actualOutput = response.run.stdout || response.run.output || '';
    if (compareOutputs(actualOutput, expectedOutput)) {
      return 'ACCEPTED';
    } else {
      return 'WRONG_ANSWER';
    }
  }

  // No expected output, just check if it ran successfully
  if (response.run.code === 0) {
    return 'ACCEPTED';
  }

  return 'RUNTIME_ERROR';
}

export class PistonProvider implements IJudgeProvider {
  private readonly client: AxiosInstance;
  private runtimeCache: PistonRuntime[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 3600000; // 1 hour

  constructor() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Optional authentication if Piston deployment requires it
    if (env.PISTON_API_KEY) {
      headers['Authorization'] = `Bearer ${env.PISTON_API_KEY}`;
    }

    this.client = axios.create({
      baseURL: env.PISTON_BASE_URL,
      headers,
      timeout: 60000, // Increased timeout for code execution
    });

    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          logger.error('Piston API error', {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
          });
        } else if (error.request) {
          logger.error('Piston network error', {
            message: error.message,
            url: error.config?.url,
          });
        }
        throw error;
      },
    );
  }

  /**
   * Fetch available runtimes from Piston
   */
  private async getRuntimes(): Promise<PistonRuntime[]> {
    const now = Date.now();
    if (this.runtimeCache && (now - this.cacheTimestamp) < this.CACHE_TTL_MS) {
      return this.runtimeCache;
    }

    try {
      const response = await this.client.get<PistonRuntime[]>('/runtimes');
      this.runtimeCache = response.data;
      this.cacheTimestamp = now;
      return this.runtimeCache;
    } catch (error) {
      logger.error('Failed to fetch Piston runtimes', { error });
      // Return cached data if available, even if stale
      if (this.runtimeCache) {
        logger.warn('Using stale runtime cache');
        return this.runtimeCache;
      }
      throw new Error('Failed to fetch Piston runtimes and no cache available');
    }
  }

  /**
   * Get Piston runtime info from Judge0 language ID
   */
  private getLanguageInfo(languageId: number): { language: string; version: string } {
    const info = LANGUAGE_MAP[languageId];
    if (!info) {
      throw new Error(`Unsupported language ID: ${languageId}. Please use a supported language.`);
    }
    return info;
  }

  /**
   * Execute code with Piston
   */
  private async executeCode(request: PistonExecuteRequest): Promise<PistonExecuteResponse> {
    return await pRetry(
      async () => {
        const response = await this.client.post<PistonExecuteResponse>('/execute', request);
        return response.data;
      },
      {
        retries: 2,
        onFailedAttempt: (err) => {
          logger.warn('Piston execute retry', { 
            attempt: err.attemptNumber, 
            error: err.message,
            retriesLeft: err.retriesLeft,
          });
        },
      },
    );
  }

  async submitBatch(requests: JudgeSubmissionRequest[]): Promise<string[]> {
    // Piston doesn't have a native batch API, so we execute sequentially
    // but use Promise.all for parallel execution
    const tokens: string[] = [];
    
    logger.info('Processing batch submission', { count: requests.length });

    // Execute all requests in parallel (Piston handles concurrent requests well)
    const results = await Promise.all(
      requests.map(async (req, index) => {
        try {
          const langInfo = this.getLanguageInfo(req.languageId);
          
          const pistonRequest: PistonExecuteRequest = {
            language: langInfo.language,
            version: langInfo.version,
            files: [{ content: req.sourceCode }],
            stdin: req.stdin,
            run_timeout: Math.ceil(req.timeLimitMs), // Convert to milliseconds
            run_memory_limit: req.memoryLimitMb * 1024 * 1024, // Convert to bytes
          };

          const response = await this.executeCode(pistonRequest);
          
          // Generate a unique token for this execution
          const token = `piston-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`;
          
          // Store the result with the token for later retrieval
          // In a production system, you might want to use Redis or similar for this
          this.storeResult(token, response, req.expectedOutput);
          
          return token;
        } catch (error) {
          logger.error('Batch submission execution failed', { 
            index, 
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Generate error token
          const errorToken = `piston-error-${Date.now()}-${index}`;
          this.storeErrorResult(errorToken);
          return errorToken;
        }
      }),
    );

    return results;
  }

  // Simple in-memory result storage (in production, use Redis)
  private resultStore: Map<string, {
    response?: PistonExecuteResponse;
    expectedOutput?: string;
    error?: boolean;
  }> = new Map();

  private storeResult(token: string, response: PistonExecuteResponse, expectedOutput?: string): void {
    this.resultStore.set(token, { response, expectedOutput });
    // Auto-cleanup after 5 minutes
    setTimeout(() => this.resultStore.delete(token), 300000);
  }

  private storeErrorResult(token: string): void {
    this.resultStore.set(token, { error: true });
    setTimeout(() => this.resultStore.delete(token), 300000);
  }

  async getResults(tokens: string[]): Promise<JudgeResult[]> {
    // Since we executed everything in submitBatch, results are immediately available
    return tokens.map((token) => {
      const stored = this.resultStore.get(token);
      
      if (!stored) {
        logger.error('Result not found for token', { token });
        return {
          token,
          verdict: 'INTERNAL_ERROR',
          stdout: null,
          stderr: 'Result not found or expired',
          compileOutput: null,
          timeTakenMs: null,
          memoryUsedKb: null,
          status: { id: 13, description: 'Internal Error' },
        };
      }

      if (stored.error) {
        return {
          token,
          verdict: 'INTERNAL_ERROR',
          stdout: null,
          stderr: 'Execution failed',
          compileOutput: null,
          timeTakenMs: null,
          memoryUsedKb: null,
          status: { id: 13, description: 'Internal Error' },
        };
      }

      const response = stored.response!;
      const verdict = determineVerdict(response, stored.expectedOutput);

      return {
        token,
        verdict,
        stdout: response.run.stdout || null,
        stderr: response.run.stderr || null,
        compileOutput: response.compile ? 
          (response.compile.stdout + response.compile.stderr).trim() || null : 
          null,
        timeTakenMs: null, // Piston doesn't return execution time in the same way
        memoryUsedKb: null, // Piston doesn't return memory usage
        status: { 
          id: verdict === 'ACCEPTED' ? 3 : verdict === 'WRONG_ANSWER' ? 4 : 6, 
          description: verdict,
        },
      };
    });
  }

  async run(request: JudgeRunRequest): Promise<JudgeRunResult> {
    try {
      const langInfo = this.getLanguageInfo(request.languageId);

      const pistonRequest: PistonExecuteRequest = {
        language: langInfo.language,
        version: langInfo.version,
        files: [{ content: request.sourceCode }],
        stdin: request.stdin,
        run_timeout: Math.ceil(request.timeLimitMs),
        run_memory_limit: request.memoryLimitMb * 1024 * 1024,
      };

      const response = await this.executeCode(pistonRequest);
      const verdict = determineVerdict(response);

      return {
        stdout: response.run.stdout || null,
        stderr: response.run.stderr || null,
        compileOutput: response.compile ?
          (response.compile.stdout + response.compile.stderr).trim() || null :
          null,
        timeTakenMs: null,
        memoryUsedKb: null,
        verdict,
      };
    } catch (error) {
      logger.error('Piston run execution failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Handle timeout specifically
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        return {
          stdout: null,
          stderr: 'Execution timed out',
          compileOutput: null,
          timeTakenMs: null,
          memoryUsedKb: null,
          verdict: 'TIME_LIMIT_EXCEEDED',
        };
      }

      return {
        stdout: null,
        stderr: error instanceof Error ? error.message : 'Internal execution error',
        compileOutput: null,
        timeTakenMs: null,
        memoryUsedKb: null,
        verdict: 'INTERNAL_ERROR',
      };
    }
  }

  async getSupportedLanguages(): Promise<Array<{ id: number; name: string }>> {
    try {
      const runtimes = await this.getRuntimes();
      
      // Build a map of available Piston runtimes
      const availableRuntimes = new Set(
        runtimes.map(rt => `${rt.language}-${rt.version}`)
      );

      // Return only the languages we support that are available in Piston
      const supported: Array<{ id: number; name: string }> = [];
      
      for (const [id, info] of Object.entries(LANGUAGE_MAP)) {
        const runtimeKey = `${info.language}-${info.version}`;
        const isAvailable = availableRuntimes.has(runtimeKey) || 
          runtimes.some(rt => rt.language === info.language);
        
        if (isAvailable) {
          const runtime = runtimes.find(rt => rt.language === info.language);
          supported.push({
            id: parseInt(id),
            name: runtime ? `${runtime.language} (${runtime.version})` : info.language,
          });
        }
      }

      logger.info('Supported languages', { count: supported.length });
      return supported;
    } catch (error) {
      logger.error('Failed to get supported languages', { error });
      
      // Fallback: return our hardcoded language map
      return Object.entries(LANGUAGE_MAP).map(([id, info]) => ({
        id: parseInt(id),
        name: info.language,
      }));
    }
  }
}
