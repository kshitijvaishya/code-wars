import './config/env'; // Load and validate env first
import { createServer } from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { requestIdMiddleware } from './utils/requestId';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './sockets';

import authRoutes from './routes/auth.routes';
import problemRoutes from './routes/problem.routes';
import battleRoutes from './routes/battle.routes';
import submissionRoutes from './routes/submission.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';

async function bootstrap() {
  await connectDatabase();

  const app = express();

  // Security
  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  }));

  // General rate limit
  app.use(rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Body parsing (limit 1mb to prevent code bombs)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Logging & request IDs
  app.use(requestIdMiddleware);
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/problems', problemRoutes);
  app.use('/api/battles', battleRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  const httpServer = createServer(app);
  const io = initializeSocket(httpServer);

  // Make io accessible in controllers
  app.locals.io = io;

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Code Wars API running on http://localhost:${env.PORT}`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    httpServer.close(async () => {
      const { disconnectDatabase } = await import('./config/database');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
