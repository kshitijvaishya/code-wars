import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/connection';
import { authenticate } from '../../lib/auth/middleware';
import { User } from '../../lib/db/models';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { UnauthorizedError } from '../../lib/utils/errors';
import { logApiError } from '../../lib/utils/apiDiagnostics';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const authUser = await authenticate(req);
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await User.findById(authUser._id);
    if (!user) {
      throw new UnauthorizedError();
    }

    return sendSuccess(res, {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      totalBattles: user.totalBattles,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    });

  } catch (error) {
    logApiError(req, '/api/auth/me', error);
    return sendError(res, error as Error);
  }
}
