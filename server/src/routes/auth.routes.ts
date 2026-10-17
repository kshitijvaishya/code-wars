import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { register, login, logout, refresh, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { env } from '../config/env';

const router = Router();

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
