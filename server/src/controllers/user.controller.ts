import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { RatingHistory } from '../models/RatingHistory';
import { Battle } from '../models/Battle';
import { sendSuccess, sendError } from '../utils/apiResponse';

export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findOne({
      $or: [{ _id: req.params.id.length === 24 ? req.params.id : null }, { username: req.params.id }],
    });

    if (!user) {
      sendError(res, 'NOT_FOUND', 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bio, avatarUrl } = req.body as { bio?: string; avatarUrl?: string };
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { ...(bio !== undefined && { bio }), ...(avatarUrl !== undefined && { avatarUrl }) },
      { new: true },
    );

    if (!user) {
      sendError(res, 'NOT_FOUND', 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function getRatingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.id;
    const history = await RatingHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', pageSize = '50', period } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page));
    const ps = Math.min(100, Math.max(1, parseInt(pageSize)));

    const query: Record<string, unknown> = { isSuspended: false };

    if (period === 'weekly') {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      // For weekly, sort by recent activity — use wins/totalBattles as proxy
      // A real weekly leaderboard would need a separate collection
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ rating: -1, wins: -1 })
        .skip((pg - 1) * ps)
        .limit(ps)
        .select('username avatarUrl rating wins losses draws winStreak totalBattles'),
      User.countDocuments(query),
    ]);

    sendSuccess(res, { items: users, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) });
  } catch (err) {
    next(err);
  }
}

// Admin: suspend a user
export async function suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true },
      { new: true },
    );
    if (!user) {
      sendError(res, 'NOT_FOUND', 'User not found', 404);
      return;
    }
    sendSuccess(res, { message: `User ${user.username} suspended` });
  } catch (err) {
    next(err);
  }
}

export async function unsuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
    if (!user) {
      sendError(res, 'NOT_FOUND', 'User not found', 404);
      return;
    }
    sendSuccess(res, { message: `User ${user.username} unsuspended` });
  } catch (err) {
    next(err);
  }
}
