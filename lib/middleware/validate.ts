import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const error = result.error as ZodError;
      sendError(res, 'VALIDATION_ERROR', 'Invalid request data', 400, error.flatten().fieldErrors);
      return;
    }
    req[target] = result.data;
    next();
  };
}
