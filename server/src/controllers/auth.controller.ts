import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError, AppError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

function formatUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    winStreak: user.winStreak,
    totalBattles: user.totalBattles,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password } = req.body as {
      username: string;
      email: string;
      password: string;
    };

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      sendError(res, 'DUPLICATE', 'Username or email already taken', 409);
      return;
    }

    const user = new User({ username, email, passwordHash: password });
    await user.save();

    const accessToken = signAccessToken({ userId: user._id.toString(), username: user.username, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: 0 });

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    logger.info('User registered', { userId: user._id.toString(), username });
    sendSuccess(res, { accessToken, refreshToken, user: formatUser(user) }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');
    if (!user) {
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      return;
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      return;
    }

    if (user.isSuspended) {
      sendError(res, 'SUSPENDED', 'Account suspended', 403);
      return;
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), username: user.username, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: 0 });

    // Keep max 5 refresh tokens per user
    const tokens = [...(user.refreshTokens || []), refreshToken].slice(-5);
    user.refreshTokens = tokens;
    await user.save();

    logger.info('User logged in', { userId: user._id.toString() });
    sendSuccess(res, { accessToken, refreshToken, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      sendError(res, 'INVALID_TOKEN', 'Refresh token required', 400);
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId).select('+refreshTokens');

    if (!user || !(user.refreshTokens || []).includes(refreshToken)) {
      sendError(res, 'INVALID_TOKEN', 'Invalid refresh token', 401);
      return;
    }

    // Rotate token
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== refreshToken);
    const newRefresh = signRefreshToken({ userId: user._id.toString(), tokenVersion: 0 });
    user.refreshTokens.push(newRefresh);
    await user.save();

    const newAccess = signAccessToken({ userId: user._id.toString(), username: user.username, role: user.role });
    sendSuccess(res, { accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    sendError(res, 'INVALID_TOKEN', 'Invalid or expired refresh token', 401);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken && req.user) {
      await User.findByIdAndUpdate(req.user.userId, {
        $pull: { refreshTokens: refreshToken },
      });
    }
    sendSuccess(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      sendError(res, 'NOT_FOUND', 'User not found', 404);
      return;
    }
    sendSuccess(res, { user: formatUser(user) });
  } catch (err) {
    next(err);
  }
}
