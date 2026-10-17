import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  handleRunCode,
  handleSubmit,
  getSubmission,
  listUserSubmissions,
  getSupportedLanguages,
} from '../controllers/submission.controller';
import { env } from '../config/env';

const router = Router();

const submitLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many submissions' } },
});

const runLimiter = rateLimit({
  windowMs: 60000,
  max: 30,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many run requests' } },
});

const runSchema = z.object({
  problemId: z.string().min(1),
  languageId: z.number().int().positive(),
  sourceCode: z.string().min(1).max(100000),
  customInput: z.string().max(10000).optional(),
});

const submitSchema = z.object({
  problemId: z.string().min(1),
  battleId: z.string().optional(),
  languageId: z.number().int().positive(),
  sourceCode: z.string().min(1).max(100000),
});

router.get('/languages', getSupportedLanguages);
router.post('/run', authenticate, runLimiter, validate(runSchema), handleRunCode);
router.post('/', authenticate, submitLimiter, validate(submitSchema), handleSubmit);
router.get('/', authenticate, listUserSubmissions);
router.get('/:id', authenticate, getSubmission);

export default router;
