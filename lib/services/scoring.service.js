import { Battle } from '../models/Battle';
import { User } from '../models/User';
import { RatingHistory } from '../models/RatingHistory';
import { logger } from '../utils/logger';
// Elo-based rating calculation
// K-factor scales with rating tier
function calculateElo(ratingA, ratingB, resultA) {
    const K = ratingA < 1400 ? 32 : ratingA < 2000 ? 24 : 16;
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const scoreA = resultA === 'win' ? 1 : resultA === 'loss' ? 0 : 0.5;
    const deltaA = Math.round(K * (scoreA - expectedA));
    const deltaB = -deltaA;
    return {
        newA: Math.max(100, ratingA + deltaA),
        newB: Math.max(100, ratingB + deltaB),
        deltaA,
        deltaB,
    };
}
class ScoringService {
    async handleSubmissionResult(battleId, userId, submissionId, verdict, score, submittedAt, io) {
        const battle = await Battle.findById(battleId);
        if (!battle || battle.state !== 'ACTIVE')
            return;
        const participantIdx = battle.participants.findIndex((p) => p.userId.toString() === userId);
        if (participantIdx === -1)
            return;
        const participant = battle.participants[participantIdx];
        // Update participant score/verdict
        if (score > participant.score) {
            battle.participants[participantIdx].score = score;
        }
        battle.participants[participantIdx].verdict = verdict;
        battle.participants[participantIdx].status = 'submitted';
        if (verdict === 'ACCEPTED' && !participant.submittedAt) {
            battle.participants[participantIdx].submittedAt = submittedAt;
        }
        await battle.save();
        // Check if battle should finalize
        await this.checkFinalization(battleId, io);
    }
    async checkFinalization(battleId, io) {
        const battle = await Battle.findById(battleId);
        if (!battle || battle.state !== 'ACTIVE')
            return;
        const { scoringMode, participants } = battle;
        let shouldFinalize = false;
        let winnerId = null;
        let isDraw = false;
        if (scoringMode === 'first_accepted') {
            const accepted = participants
                .filter((p) => p.verdict === 'ACCEPTED' && p.submittedAt)
                .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
            if (accepted.length > 0) {
                shouldFinalize = true;
                // If both accepted within 100ms, treat as draw
                if (accepted.length === 2 &&
                    Math.abs(accepted[0].submittedAt.getTime() - accepted[1].submittedAt.getTime()) < 100) {
                    isDraw = true;
                }
                else {
                    winnerId = accepted[0].userId.toString();
                }
            }
        }
        else if (scoringMode === 'score_based' || scoringMode === 'time_based') {
            const allSubmitted = participants.every((p) => p.status === 'submitted');
            if (allSubmitted) {
                shouldFinalize = true;
            }
        }
        // Check if battle time expired
        if (battle.endTime && new Date() >= battle.endTime) {
            shouldFinalize = true;
        }
        if (shouldFinalize) {
            await this.finalizeBattle(battleId, winnerId, isDraw, io);
        }
    }
    async finalizeBattle(battleId, forcedWinnerId, forcedDraw, io) {
        // Atomic check — prevent double finalization
        const battle = await Battle.findOneAndUpdate({ _id: battleId, state: 'ACTIVE' }, { state: 'FINALIZING' }, { new: true });
        if (!battle)
            return; // already finalized or not active
        logger.info('Finalizing battle', { battleId });
        const [p1, p2] = battle.participants;
        let winnerId = forcedWinnerId;
        let isDraw = forcedDraw;
        if (!winnerId && !isDraw) {
            // Determine winner based on scoring mode
            if (battle.scoringMode === 'score_based' || battle.scoringMode === 'time_based') {
                if (p1.score > p2.score) {
                    winnerId = p1.userId.toString();
                }
                else if (p2.score > p1.score) {
                    winnerId = p2.userId.toString();
                }
                else if (battle.scoringMode === 'time_based') {
                    // Tiebreak: who submitted first
                    if (p1.submittedAt && p2.submittedAt) {
                        winnerId = p1.submittedAt < p2.submittedAt
                            ? p1.userId.toString()
                            : p2.userId.toString();
                    }
                    else if (p1.submittedAt) {
                        winnerId = p1.userId.toString();
                    }
                    else if (p2.submittedAt) {
                        winnerId = p2.userId.toString();
                    }
                    else {
                        isDraw = true;
                    }
                }
                else {
                    isDraw = true;
                }
            }
            else {
                isDraw = true;
            }
        }
        // Calculate Elo
        const user1 = await User.findById(p1.userId);
        const user2 = await User.findById(p2.userId);
        if (user1 && user2) {
            const result1 = isDraw ? 'draw' : winnerId === p1.userId.toString() ? 'win' : 'loss';
            const { newA, newB, deltaA, deltaB } = calculateElo(user1.rating, user2.rating, result1);
            battle.participants[0].ratingDelta = deltaA;
            battle.participants[1].ratingDelta = deltaB;
            battle.winnerId = winnerId ? battle.participants.find(p => p.userId.toString() === winnerId).userId : null;
            battle.isDraw = isDraw;
            battle.state = 'COMPLETED';
            await battle.save();
            // Update user stats
            const updateUser = async (user, newRating, delta, result) => {
                const before = user.rating;
                user.rating = newRating;
                user.totalBattles += 1;
                if (result === 'win') {
                    user.wins += 1;
                    user.winStreak += 1;
                }
                else if (result === 'loss') {
                    user.losses += 1;
                    user.winStreak = 0;
                }
                else {
                    user.draws += 1;
                }
                await user.save();
                await RatingHistory.create({
                    userId: user._id,
                    battleId,
                    ratingBefore: before,
                    ratingAfter: newRating,
                    delta,
                });
            };
            await Promise.all([
                updateUser(user1, newA, deltaA, result1),
                updateUser(user2, newB, deltaB, result1 === 'win' ? 'loss' : result1 === 'loss' ? 'win' : 'draw'),
            ]);
        }
        else {
            battle.winnerId = winnerId ? battle.participants.find(p => p.userId.toString() === winnerId).userId : null;
            battle.isDraw = isDraw;
            battle.state = 'COMPLETED';
            await battle.save();
        }
        logger.info('Battle completed', { battleId, winnerId, isDraw });
        // Notify clients
        if (io) {
            io.to(`battle:${battleId}`).emit('battle:completed', {
                battleId,
                winnerId,
                isDraw,
            });
            io.to(`battle:${battleId}`).emit('battle:state_changed', {
                battleId,
                state: 'COMPLETED',
            });
        }
    }
}
export const scoringService = new ScoringService();
