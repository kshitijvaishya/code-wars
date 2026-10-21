import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { User } from '../models/User';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: string;
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'No token provided', 401);
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyAccessToken(token);

    // Check if user is suspended
    const user = await User.findById(payload.userId).select('isSuspended role').lean();
    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'User not found', 401);
      return;
    }
    if (user.isSuspended) {
      sendError(res, 'SUSPENDED', 'Account suspended', 403);
      return;
    }

    req.user = {
      userId: payload.userId,
      username: payload.username,
      role: user.role, // use DB role, not token role (more secure)
    };
    next();
  } catch {
    sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}
