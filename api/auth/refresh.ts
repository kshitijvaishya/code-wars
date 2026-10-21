import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/connection';
import { User } from '../../lib/db/models';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../lib/auth/jwt';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { UnauthorizedError, ValidationError } from '../../lib/utils/errors';
import { logApiError } from '../../lib/utils/apiDiagnostics';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and verify token is valid
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    
    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (!user.refreshTokens.includes(refreshToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens
      .filter((t: string) => t !== refreshToken)
      .concat(newRefreshToken)
      .slice(-5); // Keep last 5 tokens

    await user.save();

    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error) {
    logApiError(req, '/api/auth/refresh', error);
    return sendError(res, error as Error);
  }
}
