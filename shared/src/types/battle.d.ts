export type BattleState = 'WAITING' | 'READY_CHECK' | 'COUNTDOWN' | 'ACTIVE' | 'FINALIZING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type ScoringMode = 'first_accepted' | 'score_based' | 'time_based' | 'best_of_three';
export type ParticipantStatus = 'waiting' | 'connected' | 'ready' | 'coding' | 'submitted' | 'disconnected';
export interface BattleParticipant {
    userId: string;
    username: string;
    avatarUrl: string | null;
    rating: number;
    status: ParticipantStatus;
    isReady: boolean;
    score: number;
    submittedAt: string | null;
    verdict: string | null;
}
export interface BattleRoom {
    id: string;
    inviteCode: string;
    state: BattleState;
    scoringMode: ScoringMode;
    difficulty: string;
    durationSeconds: number;
    startTime: string | null;
    endTime: string | null;
    participants: BattleParticipant[];
    problemId: string | null;
    winnerId: string | null;
    createdAt: string;
}
export interface BattleResult {
    battleId: string;
    winnerId: string | null;
    isDraw: boolean;
    participants: Array<{
        userId: string;
        username: string;
        score: number;
        verdict: string | null;
        ratingDelta: number;
    }>;
    problemId: string;
    scoringMode: ScoringMode;
    completedAt: string;
}
