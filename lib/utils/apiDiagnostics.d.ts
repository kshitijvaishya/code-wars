import type { VercelRequest } from '@vercel/node';
export declare function logApiError(req: VercelRequest, endpoint: string, error: unknown): void;
