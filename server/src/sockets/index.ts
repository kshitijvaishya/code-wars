import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Battle } from '../models/Battle';
import { battleService } from '../services/battle.service';
import { matchmakingService } from '../services/matchmaking.service';
import { logger } from '../utils/logger';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@code-wars/shared';
import { env } from '../config/env';

export function initializeSocket(
  httpServer: HttpServer,
): SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    },
  );

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId).select('username role isSuspended').lean();
      if (!user || user.isSuspended) {
        return next(new Error('Unauthorized'));
      }
      socket.data.userId = payload.userId;
      socket.data.username = user.username;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, username } = socket.data;
    logger.info('Socket connected', { userId, socketId: socket.id });

    // Each user joins their personal room
    socket.join(`user:${userId}`);

    // ── Battle events ──────────────────────────────────────────────────────

    socket.on('battle:join', async ({ battleId, inviteCode }, callback) => {
      try {
        const battle = await battleService.joinBattle(battleId ?? null, inviteCode ?? null, userId, socket.id);
        const bid = battle._id.toString();

        socket.join(`battle:${bid}`);

        // Broadcast the complete roster so both clients stay in sync after a
        // join or reconnect, including a participant added after initial load.
        for (const participant of battle.participants) {
          io.to(`battle:${bid}`).emit('battle:participant_updated', {
            battleId: bid,
            participant: battleService.formatParticipant(participant),
          });
        }

        io.to(`battle:${bid}`).emit('battle:state_changed', {
          battleId: bid,
          state: battle.state,
          startTime: battle.startTime?.toISOString(),
          endTime: battle.endTime?.toISOString(),
        });

        callback(null, { battleId: bid });
      } catch (err) {
        callback((err as Error).message);
      }
    });

    socket.on('battle:ready', async ({ battleId }, callback) => {
      try {
        await battleService.setReady(battleId, userId, true, io);
        callback?.(null);
      } catch (err) {
        callback?.((err as Error).message);
      }
    });

    socket.on('battle:unready', async ({ battleId }, callback) => {
      try {
        await battleService.setReady(battleId, userId, false, io);
        callback?.(null);
      } catch (err) {
        callback?.((err as Error).message);
      }
    });

    socket.on('battle:status_update', async ({ battleId, status }) => {
      try {
        const battle = await Battle.findById(battleId);
        if (!battle) return;

        const participant = battle.participants.find((p) => p.userId.toString() === userId);
        if (!participant) return;

        participant.status = status;
        await battle.save();

        // Notify only the opponent
        io.to(`battle:${battleId}`).emit('opponent:status', {
          battleId,
          userId,
          status,
        });
      } catch (err) {
        logger.error('Status update error', { error: (err as Error).message });
      }
    });

    socket.on('battle:leave', async ({ battleId }) => {
      socket.leave(`battle:${battleId}`);
    });

    // ── Matchmaking events ─────────────────────────────────────────────────

    socket.on('matchmaking:join', async ({ difficulty, scoringMode }) => {
      try {
        const user = await User.findById(userId).select('rating username').lean();
        if (!user) return;

        await matchmakingService.joinQueue(
          userId,
          username,
          user.rating,
          difficulty as 'easy' | 'medium' | 'hard',
          scoringMode as 'first_accepted' | 'score_based' | 'time_based' | 'best_of_three',
          socket.id,
          io,
        );
      } catch (err) {
        socket.emit('error', { code: 'MATCHMAKING_ERROR', message: (err as Error).message });
      }
    });

    socket.on('matchmaking:cancel', () => {
      matchmakingService.leaveQueue(userId);
    });

    // ── Disconnect ─────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      logger.info('Socket disconnected', { userId, socketId: socket.id });
      matchmakingService.leaveQueue(userId);
      await battleService.handleDisconnect(userId, socket.id, io);
    });
  });

  return io;
}
