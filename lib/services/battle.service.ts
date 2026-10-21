import crypto from 'crypto';
import { Battle } from '../models/Battle';
import { Problem } from '../models/Problem';
import { User } from '../models/User';
import { AppError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import type { ScoringMode } from '@code-wars/shared';
import type { Server as SocketServer } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@code-wars/shared';
import { scoringService } from './scoring.service';
import { getInviteError } from '../utils/battleInvite';

function generateInviteCode(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

async function pickProblem(difficulty: string): Promise<string> {
  const problems = await Problem.find({ difficulty, isPublished: true }).select('_id').lean();
  if (problems.length === 0) throw new AppError('NO_PROBLEMS', `No published problems for difficulty: ${difficulty}`, 400);
  const idx = Math.floor(Math.random() * problems.length);
  return (problems[idx]._id as { toString(): string }).toString();
}

export class BattleService {
  async createPrivateBattle(
    userId: string,
    options: {
      difficulty: 'easy' | 'medium' | 'hard';
      scoringMode: ScoringMode;
      durationSeconds?: number;
    },
  ): Promise<InstanceType<typeof Battle>> {
    const user = await User.findById(userId).select('username avatarUrl rating');
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    let battle: InstanceType<typeof Battle> | null = null;
    for (let attempt = 0; attempt < 3 && !battle; attempt += 1) {
      try {
        battle = await Battle.create({
          inviteCode: generateInviteCode(),
          inviteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          state: 'WAITING',
          scoringMode: options.scoringMode,
          difficulty: options.difficulty,
          durationSeconds: options.durationSeconds ?? env.DEFAULT_BATTLE_DURATION_SECONDS,
          isPrivate: true,
          participants: [
            {
              userId: user._id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              rating: user.rating,
              status: 'connected',
              isReady: false,
              score: 0,
              totalScore: 0,
              submittedAt: null,
              verdict: null,
              ratingDelta: 0,
              socketId: null,
              lastSeenAt: new Date(),
            },
          ],
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000 || attempt === 2) throw error;
      }
    }
    if (!battle) throw new AppError('INVITE_CREATE_FAILED', 'Could not create a unique invite code', 500);

    logger.info('Private battle created', {
      battleId: battle._id.toString(),
      userId,
      inviteCode: battle.inviteCode,
    });
    return battle;
  }

  async joinBattle(
    battleId: string | null,
    inviteCode: string | null,
    userId: string,
    socketId: string,
  ): Promise<InstanceType<typeof Battle>> {
    const normalizedCode = inviteCode?.trim().toUpperCase() ?? null;
    const query = battleId ? { _id: battleId } : { inviteCode: normalizedCode };
    let battle = await Battle.findOne(query);

    if (!battle) throw new AppError('NOT_FOUND', 'Battle not found', 404);

    if (normalizedCode) {
      const inviteError = getInviteError(battle, userId);
      if (inviteError) throw new AppError(inviteError.code, inviteError.message, inviteError.status);
    }

    const existingParticipant = battle.participants.find((p) => p.userId.toString() === userId);

    if (existingParticipant) {
      battle = await Battle.findOneAndUpdate(
        { _id: battle._id, 'participants.userId': existingParticipant.userId },
        {
          $set: {
            'participants.$.socketId': socketId,
            'participants.$.lastSeenAt': new Date(),
          },
        },
        { new: true },
      ) ?? battle;
      logger.info('Participant reconnected', { battleId: battle._id.toString(), userId });
      return battle;
    }

    if (battle.state !== 'WAITING') {
      const code = ['COUNTDOWN', 'ACTIVE', 'FINALIZING', 'COMPLETED', 'CANCELLED', 'FAILED'].includes(battle.state)
        ? 'BATTLE_ALREADY_STARTED'
        : 'BATTLE_FULL';
      throw new AppError(code, code === 'BATTLE_FULL' ? 'Battle is already full' : 'Battle has already started or ended', 409);
    }
    if (battle.inviteExpiresAt && battle.inviteExpiresAt <= new Date()) {
      throw new AppError('INVITE_EXPIRED', 'This invite code has expired', 410);
    }

    const user = await User.findById(userId).select('username avatarUrl rating');
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const participant = {
      userId: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      rating: user.rating,
      status: 'connected',
      isReady: false,
      score: 0,
      totalScore: 0,
      submittedAt: null,
      verdict: null,
      ratingDelta: 0,
      socketId,
      lastSeenAt: new Date(),
    };
    const joinFilter = {
      _id: battle._id,
      state: 'WAITING',
      'participants.userId': { $ne: user._id },
      $expr: { $lt: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
      $or: [
        { inviteExpiresAt: null },
        { inviteExpiresAt: { $exists: false } },
        { inviteExpiresAt: { $gt: new Date() } },
      ],
    };
    const joinedBattle = await Battle.findOneAndUpdate(
      joinFilter,
      {
        $push: { participants: participant },
        $set: { state: 'READY_CHECK' },
      },
      { new: true, runValidators: true },
    );
    if (joinedBattle) {
      logger.info('Participant joined battle', { battleId: joinedBattle._id.toString(), userId });
      return joinedBattle;
    }

    const latestBattle = await Battle.findById(battle._id);
    if (!latestBattle) throw new AppError('NOT_FOUND', 'Battle not found', 404);
    if (latestBattle.participants.some((p) => p.userId.toString() === userId)) {
      return this.joinBattle(latestBattle._id.toString(), null, userId, socketId);
    }
    if (latestBattle.inviteExpiresAt && latestBattle.inviteExpiresAt <= new Date()) {
      throw new AppError('INVITE_EXPIRED', 'This invite code has expired', 410);
    }
    if (latestBattle.state !== 'WAITING') {
      throw new AppError('BATTLE_FULL', 'Battle already has two players or is no longer waiting', 409);
    }
    throw new AppError('BATTLE_FULL', 'Battle is already full', 409);
  }

  async setReady(
    battleId: string,
    userId: string,
    isReady: boolean,
    io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  ): Promise<void> {
    const battle = await Battle.findById(battleId);
    if (!battle) throw new AppError('NOT_FOUND', 'Battle not found', 404);
    if (battle.state !== 'READY_CHECK') throw new AppError('INVALID_STATE', 'Battle is not in ready check', 400);

    const participant = battle.participants.find((p) => p.userId.toString() === userId);
    if (!participant) throw new AppError('FORBIDDEN', 'Not a participant', 403);

    participant.isReady = isReady;
    participant.status = isReady ? 'ready' : 'connected';
    await battle.save();

    io.to(`battle:${battleId}`).emit('battle:participant_updated', {
      battleId,
      participant: this.formatParticipant(participant),
    });

    // Both ready → start countdown
    if (battle.participants.length === 2 && battle.participants.every((p) => p.isReady)) {
      await this.startCountdown(battleId, io);
    }
  }

  async startCountdown(
    battleId: string,
    io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  ): Promise<void> {
    await Battle.findByIdAndUpdate(battleId, { state: 'COUNTDOWN' });

    io.to(`battle:${battleId}`).emit('battle:state_changed', {
      battleId,
      state: 'COUNTDOWN',
    });

    let count = 5;
    const interval = setInterval(async () => {
      io.to(`battle:${battleId}`).emit('battle:countdown', {
        battleId,
        secondsRemaining: count,
      });

      if (count === 0) {
        clearInterval(interval);
        await this.startBattle(battleId, io);
      }
      count--;
    }, 1000);
  }

  async startBattle(
    battleId: string,
    io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  ): Promise<void> {
    const battle = await Battle.findById(battleId);
    if (!battle) return;

    // Pick problem
    const problemId = await pickProblem(battle.difficulty);
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + battle.durationSeconds * 1000);

    await Battle.findByIdAndUpdate(battleId, {
      state: 'ACTIVE',
      problemId,
      startTime,
      endTime,
      'participants.$[].status': 'coding',
    });

    io.to(`battle:${battleId}`).emit('battle:state_changed', {
      battleId,
      state: 'ACTIVE',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });

    logger.info('Battle started', { battleId, problemId, endTime });

    // Schedule battle end
    const ms = battle.durationSeconds * 1000;
    setTimeout(async () => {
      const current = await Battle.findById(battleId);
      if (current?.state === 'ACTIVE') {
        logger.info('Battle time expired', { battleId });
        await scoringService.finalizeBattle(battleId, null, false, io);
      }
    }, ms);

    // The server remains authoritative; broadcast the remaining time every
    // second so clients stay synchronized even when their clocks differ.
    const syncInterval = setInterval(async () => {
      const current = await Battle.findById(battleId);
      if (!current || current.state !== 'ACTIVE') {
        clearInterval(syncInterval);
        return;
      }
      const remaining = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
      io.to(`battle:${battleId}`).emit('battle:timer_sync', {
        battleId,
        secondsRemaining: remaining,
        serverTime: new Date().toISOString(),
      });
    }, 1000);
  }

  async handleDisconnect(
    userId: string,
    socketId: string,
    io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  ): Promise<void> {
    const battle = await Battle.findOne({
      'participants.socketId': socketId,
      state: { $in: ['WAITING', 'READY_CHECK', 'COUNTDOWN', 'ACTIVE'] },
    });

    if (!battle) return;

    const participant = battle.participants.find((p) => p.socketId === socketId);
    if (!participant) return;

    participant.status = 'disconnected';
    participant.lastSeenAt = new Date();
    await battle.save();

    const battleId = battle._id.toString();

    io.to(`battle:${battleId}`).emit('opponent:disconnected', {
      battleId,
      userId,
      gracePeriodSeconds: env.DISCONNECT_GRACE_SECONDS,
    });

    logger.info('Participant disconnected', { battleId, userId, gracePeriodSeconds: env.DISCONNECT_GRACE_SECONDS });

    // Grace period: if still disconnected → forfeit
    setTimeout(async () => {
      const updated = await Battle.findById(battleId);
      if (!updated || updated.state === 'COMPLETED' || updated.state === 'CANCELLED') return;

      const p = updated.participants.find((p) => p.userId.toString() === userId);
      if (p && p.status === 'disconnected') {
        const other = updated.participants.find((p) => p.userId.toString() !== userId);
        logger.info('Participant forfeited due to disconnect', { battleId, userId });
        if (updated.state === 'ACTIVE') {
          await scoringService.finalizeBattle(battleId, other?.userId.toString() ?? null, false, io);
        } else {
          await Battle.findByIdAndUpdate(battleId, { state: 'CANCELLED' });
          io.to(`battle:${battleId}`).emit('battle:state_changed', { battleId, state: 'CANCELLED' });
        }
      }
    }, env.DISCONNECT_GRACE_SECONDS * 1000);
  }

  formatParticipant(p: { userId: { toString(): string }; username: string; avatarUrl: string | null; rating: number; status: string; isReady: boolean; score: number; submittedAt: Date | null; verdict: string | null }) {
    return {
      userId: p.userId.toString(),
      username: p.username,
      avatarUrl: p.avatarUrl,
      rating: p.rating,
      status: p.status as 'waiting' | 'connected' | 'ready' | 'coding' | 'submitted' | 'disconnected',
      isReady: p.isReady,
      score: p.score,
      submittedAt: p.submittedAt?.toISOString() ?? null,
      verdict: p.verdict,
    };
  }
}

export const battleService = new BattleService();
