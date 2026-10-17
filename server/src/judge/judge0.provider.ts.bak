import axios, { AxiosInstance } from 'axios';
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

// Judge0 status ID → Code Wars verdict
const STATUS_MAP: Record<number, SubmissionVerdict> = {
  1: 'PENDING',
  2: 'PROCESSING',
  3: 'ACCEPTED',
  4: 'WRONG_ANSWER',
  5: 'TIME_LIMIT_EXCEEDED',
  6: 'COMPILATION_ERROR',
  7: 'RUNTIME_ERROR',
  8: 'RUNTIME_ERROR',
  9: 'RUNTIME_ERROR',
  10: 'RUNTIME_ERROR',
  11: 'RUNTIME_ERROR',
  12: 'RUNTIME_ERROR',
  13: 'INTERNAL_ERROR',
  14: 'RUNTIME_ERROR',
};

function toBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

function fromBase64(str: string | null): string | null {
  if (!str) return null;
  return Buffer.from(str, 'base64').toString('utf8');
}

export class Judge0Provider implements IJudgeProvider {
  private readonly client: AxiosInstance;

  constructor() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (env.JUDGE0_API_KEY) {
      headers['X-Auth-Token'] = env.JUDGE0_API_KEY;
    }
    this.client = axios.create({
      baseURL: env.JUDGE0_BASE_URL,
      headers,
      timeout: 30000,
    });
  }

  async submitBatch(requests: JudgeSubmissionRequest[]): Promise<string[]> {
    const submissions = requests.map((r) => ({
      language_id: r.languageId,
      source_code: toBase64(r.sourceCode),
      stdin: toBase64(r.stdin),
      expected_output: toBase64(r.expectedOutput),
      cpu_time_limit: r.timeLimitMs / 1000,
      memory_limit: r.memoryLimitMb * 1024,
      cpu_extra_time: r.cpuExtraTime ?? 0.5,
      enable_network: false,
    }));

    const response = await pRetry(
      async () => {
        const res = await this.client.post('/submissions/batch?base64_encoded=true', {
          submissions,
        });
        return res.data;
      },
      {
        retries: 3,
        onFailedAttempt: (err) => {
          logger.warn('Judge0 batch submit retry', { attempt: err.attemptNumber, error: err.message });
        },
      },
    );

    return (response as Array<{ token: string }>).map((r) => r.token);
  }

  async getResults(tokens: string[]): Promise<JudgeResult[]> {
    const tokenStr = tokens.join(',');
    const MAX_POLLS = 20;
    const POLL_INTERVAL_MS = 800;

    for (let i = 0; i < MAX_POLLS; i++) {
      const response = await this.client.get(
        `/submissions/batch?tokens=${tokenStr}&base64_encoded=true&fields=token,status,stdout,stderr,compile_output,time,memory`,
      );

      const results = response.data.submissions as Array<{
        token: string;
        status: { id: number; description: string };
        stdout: string | null;
        stderr: string | null;
        compile_output: string | null;
        time: string | null;
        memory: number | null;
      }>;

      const allDone = results.every((r) => r.status.id > 2);

      if (allDone) {
        return results.map((r) => ({
          token: r.token,
          verdict: STATUS_MAP[r.status.id] ?? 'INTERNAL_ERROR',
          stdout: fromBase64(r.stdout),
          stderr: fromBase64(r.stderr),
          compileOutput: fromBase64(r.compile_output),
          timeTakenMs: r.time ? Math.round(parseFloat(r.time) * 1000) : null,
          memoryUsedKb: r.memory ?? null,
          status: r.status,
        }));
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error('Judge0 polling timed out');
  }

  async run(request: JudgeRunRequest): Promise<JudgeRunResult> {
    const payload = {
      language_id: request.languageId,
      source_code: toBase64(request.sourceCode),
      stdin: toBase64(request.stdin),
      cpu_time_limit: request.timeLimitMs / 1000,
      memory_limit: request.memoryLimitMb * 1024,
      enable_network: false,
    };

    const response = await pRetry(
      async () => {
        const res = await this.client.post('/submissions?base64_encoded=true&wait=true', payload);
        return res.data;
      },
      { retries: 2 },
    );

    const r = response as {
      status: { id: number };
      stdout: string | null;
      stderr: string | null;
      compile_output: string | null;
      time: string | null;
      memory: number | null;
    };

    return {
      stdout: fromBase64(r.stdout),
      stderr: fromBase64(r.stderr),
      compileOutput: fromBase64(r.compile_output),
      timeTakenMs: r.time ? Math.round(parseFloat(r.time) * 1000) : null,
      memoryUsedKb: r.memory ?? null,
      verdict: STATUS_MAP[r.status.id] ?? 'INTERNAL_ERROR',
    };
  }

  async getSupportedLanguages(): Promise<Array<{ id: number; name: string }>> {
    const response = await this.client.get('/languages');
    return response.data as Array<{ id: number; name: string }>;
  }
}
