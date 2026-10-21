import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../lib/db/connection';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await connectDB();
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
