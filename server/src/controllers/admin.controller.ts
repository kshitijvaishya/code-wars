import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { Battle } from '../models/Battle';
import { Submission } from '../models/Submission';
import { User } from '../models/User';
import { Problem } from '../models/Problem';
import { sendSuccess } from '../utils/apiResponse';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', pageSize = '50', action, resourceType } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page));
    const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip((pg - 1) * ps).limit(ps).populate('actorId', 'username'),
      AuditLog.countDocuments(query),
    ]);

    sendSuccess(res, { items: logs, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [
      totalUsers,
      activeBattles,
      totalBattles,
      totalSubmissions,
      recentBattles,
      publishedProblems,
      draftProblems,
      recentProblems,
    ] = await Promise.all([
      User.countDocuments({}),
      Battle.countDocuments({ state: 'ACTIVE' }),
      Battle.countDocuments({}),
      Submission.countDocuments({}),
      Battle.find({ state: 'COMPLETED' }).sort({ updatedAt: -1 }).limit(10).populate('participants.userId', 'username'),
      Problem.countDocuments({ $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] }),
      Problem.countDocuments({ $or: [{ status: 'draft' }, { status: { $exists: false }, isPublished: false }] }),
      Problem.find({}).sort({ updatedAt: -1 }).limit(5).select('-hiddenTestCases'),
    ]);

    sendSuccess(res, {
      totalUsers,
      activeBattles,
      totalBattles,
      totalSubmissions,
      recentBattles,
      publishedProblems,
      draftProblems,
      recentProblems,
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', pageSize = '50', search } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page));
    const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
    const query: Record<string, unknown> = {};
    if (search) query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((pg - 1) * ps).limit(ps),
      User.countDocuments(query),
    ]);

    sendSuccess(res, { items: users, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) });
  } catch (err) {
    next(err);
  }
}
