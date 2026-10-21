import { Response } from 'express';
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number): Response;
export declare function sendError(res: Response, code: string, message: string, statusCode?: number, details?: unknown): Response;
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: unknown;
    constructor(code: string, message: string, statusCode?: number, details?: unknown);
}
