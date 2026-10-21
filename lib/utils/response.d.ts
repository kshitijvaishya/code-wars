import type { VercelResponse } from '@vercel/node';
import { ApiError } from './errors';
export declare function sendSuccess(res: VercelResponse, data: any, statusCode?: number): VercelResponse;
export declare function sendError(res: VercelResponse, error: Error | ApiError): VercelResponse;
export declare function sendValidationError(res: VercelResponse, errors: any): VercelResponse;
