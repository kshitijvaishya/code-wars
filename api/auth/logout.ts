import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/connection';
import { User } from '../../lib/db/models';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { ValidationError } from '../../lib/utils/errors';
import { logApiError } from '../../lib/utils/apiDiagnostics';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) throw new ValidationError('Refresh token is required');
    await connectDB();
    await User.updateOne({ refreshTokens: refreshToken }, { $pull: { refreshTokens: refreshToken } });
    return sendSuccess(res, { loggedOut: true });
  } catch (error) {
    logApiError(req, '/api/auth/logout', error);
    return sendError(res, error as Error);
  }
}
