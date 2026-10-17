import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.error('❌ MongoDB connection failed', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB error', { error });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
