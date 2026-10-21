import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Battle } from '../models/Battle';
import { Submission } from '../models/Submission';
import { battleService } from '../services/battle.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { getInviteError } from '../utils/battleInvite';

const createBattleSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  scoringMode: z.enum(['first_accepted', 'score_based', 'time_based', 'best_of_three']).default('first_accepted'),
  durationSeconds: z.number().int().min(300).max(7200).optional(),
});

export async function createPrivateBattle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const options = createBattleSchema.parse(req.body);
    const battle = await battleService.createPrivateBattle(req.user!.userId, options);

    sendSuccess(res, {
      battleId: battle._id.toString(),
      inviteCode: battle.inviteCode,
      inviteExpiresAt: battle.inviteExpiresAt,
      inviteLink: `${process.env.CLIENT_URL ?? ''}/battle/join/${battle.inviteCode}`,
      state: battle.state,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getBattle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const battle = await Battle.findById(req.params.id).select('-participants.socketId');
    if (!battle) {
      sendError(res, 'NOT_FOUND', 'Battle not found', 404);
      return;
    }

    // Only participants (or admins) can view active battles
    const isParticipant = battle.participants.some((p) => p.userId.toString() === req.user!.userId);
    const isAdmin = ['contest_admin', 'super_admin'].includes(req.user!.role);

    if (!isParticipant && !isAdmin && battle.state !== 'COMPLETED') {
      sendError(res, 'FORBIDDEN', 'Not authorized to view this battle', 403);
      return;
    }

    sendSuccess(res, battle);
  } catch (err) {
    next(err);
  }
}

export async function getBattleByInviteCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inviteCode = req.params.code.trim().toUpperCase();
    const battle = await Battle.findOne({ inviteCode }).select('-participants.socketId');
    if (!battle) {
      sendError(res, 'INVALID_INVITE', 'Invite code is invalid', 404);
      return;
    }
    const inviteError = getInviteError(battle, req.user!.userId);
    if (inviteError) {
      sendError(res, inviteError.code, inviteError.message, inviteError.status);
      return;
    }
    sendSuccess(res, battle);
  } catch (err) {
    next(err);
  }
}

export async function getUserBattleHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId ?? req.user!.userId;
    const { page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page));
    const ps = Math.min(50, Math.max(1, parseInt(pageSize)));

    const [battles, total] = await Promise.all([
      Battle.find({
        'participants.userId': userId,
        state: 'COMPLETED',
      })
        .sort({ updatedAt: -1 })
        .skip((pg - 1) * ps)
        .limit(ps)
        .select('-participants.socketId'),
      Battle.countDocuments({ 'participants.userId': userId, state: 'COMPLETED' }),
    ]);

    sendSuccess(res, { items: battles, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) });
  } catch (err) {
    next(err);
  }
}

export async function getBattleResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const battle = await Battle.findById(req.params.id).populate('problemId', 'title slug difficulty');
    if (!battle) {
      sendError(res, 'NOT_FOUND', 'Battle not found', 404);
      return;
    }
    if (battle.state !== 'COMPLETED') {
      sendError(res, 'BATTLE_NOT_COMPLETED', 'Battle is not yet completed', 400);
      return;
    }
    sendSuccess(res, battle);
  } catch (err) {
    next(err);
  }
}
