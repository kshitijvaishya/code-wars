// Augment Express Request to carry requestId and user
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    user?: {
      userId: string;
      username: string;
      role: string;
    };
  }
}
