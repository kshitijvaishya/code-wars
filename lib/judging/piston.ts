import axios from 'axios';

const pistonClient = axios.create({
  baseURL: process.env.PISTON_BASE_URL || 'https://emkc.org/api/v2/piston',
  timeout: 15000,
  headers: process.env.PISTON_API_KEY ? {
    'Authorization': `Bearer ${process.env.PISTON_API_KEY}`
  } : {}
});

export interface ExecuteRequest {
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
}

export interface ExecuteResult {
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
  run: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
  language: string;
  version: string;
}

export interface Runtime {
  language: string;
  version: string;
  aliases: string[];
}

export async function executeCode(request: ExecuteRequest): Promise<ExecuteResult> {
  try {
    const response = await pistonClient.post<ExecuteResult>('/execute', request);
    return response.data;
  } catch (error) {
    console.error('Piston execution error:', error);
    throw new Error('Code execution failed');
  }
}

export async function getRuntimes(): Promise<Runtime[]> {
  try {
    const response = await pistonClient.get<Runtime[]>('/runtimes');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch runtimes:', error);
    throw new Error('Failed to fetch available languages');
  }
}

// Language mappings
export const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  'python': { language: 'python', version: '3.10.0' },
  'javascript': { language: 'javascript', version: '18.15.0' },
  'typescript': { language: 'typescript', version: '5.0.3' },
  'java': { language: 'java', version: '15.0.2' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'c': { language: 'c', version: '10.2.0' },
  'rust': { language: 'rust', version: '1.68.2' },
  'go': { language: 'go', version: '1.16.2' },
};

export function getLanguageConfig(lang: string): { language: string; version: string } {
  const config = LANGUAGE_MAP[lang.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported language: ${lang}`);
  }
  return config;
}
