import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
      requestId: req.requestId,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message },
      requestId: req.requestId,
    });
    return;
  }

  // MongoDB duplicate key
  if ((err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE', message: 'Resource already exists' },
      requestId: req.requestId,
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    requestId: req.requestId,
  });
}
