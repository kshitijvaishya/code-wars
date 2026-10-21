import { battleService } from './battle.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';
class MatchmakingService {
    constructor() {
        this.queue = [];
    }
    async joinQueue(userId, username, rating, difficulty, scoringMode, socketId, io) {
        // Remove existing entry
        this.leaveQueue(userId);
        const timeoutHandle = setTimeout(() => {
            this.leaveQueue(userId);
            io.to(`user:${userId}`).emit('matchmaking:cancelled', { reason: 'Matchmaking timed out. Please try again.' });
        }, env.MATCHMAKING_TIMEOUT_SECONDS * 1000);
        this.queue.push({ userId, username, rating, difficulty, scoringMode, socketId, joinedAt: new Date(), timeoutHandle });
        logger.info('Player joined matchmaking queue', { userId, difficulty, queueLength: this.queue.length });
        await this.tryMatch(io);
    }
    leaveQueue(userId) {
        const idx = this.queue.findIndex((e) => e.userId === userId);
        if (idx !== -1) {
            clearTimeout(this.queue[idx].timeoutHandle);
            this.queue.splice(idx, 1);
            logger.info('Player left matchmaking queue', { userId });
        }
    }
    async tryMatch(io) {
        // Group by difficulty + scoring mode, sort by rating proximity
        for (let i = 0; i < this.queue.length; i++) {
            const candidate = this.queue[i];
            const RATING_TOLERANCE = 400;
            const opponentIdx = this.queue.findIndex((e, idx) => {
                if (idx === i)
                    return false;
                if (e.difficulty !== candidate.difficulty)
                    return false;
                if (e.scoringMode !== candidate.scoringMode)
                    return false;
                if (Math.abs(e.rating - candidate.rating) > RATING_TOLERANCE)
                    return false;
                return true;
            });
            if (opponentIdx !== -1) {
                const opponent = this.queue[opponentIdx];
                // Remove both from queue
                clearTimeout(candidate.timeoutHandle);
                clearTimeout(opponent.timeoutHandle);
                // Remove in reverse order to preserve indices
                const [first, second] = [i, opponentIdx].sort((a, b) => b - a);
                this.queue.splice(first, 1);
                this.queue.splice(second, 1);
                await this.createMatch(candidate, opponent, io);
                break;
            }
        }
    }
    async createMatch(p1, p2, io) {
        try {
            const battle = await battleService.createPrivateBattle(p1.userId, {
                difficulty: p1.difficulty,
                scoringMode: p1.scoringMode,
                durationSeconds: env.DEFAULT_BATTLE_DURATION_SECONDS,
            });
            await battleService.joinBattle(battle._id.toString(), null, p2.userId, p2.socketId);
            const battleId = battle._id.toString();
            const inviteCode = battle.inviteCode;
            io.to(`user:${p1.userId}`).emit('matchmaking:found', { battleId, inviteCode });
            io.to(`user:${p2.userId}`).emit('matchmaking:found', { battleId, inviteCode });
            logger.info('Match created', { battleId, p1: p1.userId, p2: p2.userId });
        }
        catch (err) {
            logger.error('Match creation failed', { error: err.message });
            io.to(`user:${p1.userId}`).emit('matchmaking:cancelled', { reason: 'Match creation failed. Please try again.' });
            io.to(`user:${p2.userId}`).emit('matchmaking:cancelled', { reason: 'Match creation failed. Please try again.' });
        }
    }
    getQueueLength() {
        return this.queue.length;
    }
}
export const matchmakingService = new MatchmakingService();
