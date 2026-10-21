import type { BattleState, BattleParticipant, ParticipantStatus } from './battle';
import type { SubmissionVerdict } from './submission';
export interface ServerToClientEvents {
    'battle:joined': (payload: {
        battleId: string;
        inviteCode: string;
    }) => void;
    'battle:participant_updated': (payload: {
        battleId: string;
        participant: BattleParticipant;
    }) => void;
    'battle:state_changed': (payload: {
        battleId: string;
        state: BattleState;
        startTime?: string;
        endTime?: string;
    }) => void;
    'battle:countdown': (payload: {
        battleId: string;
        secondsRemaining: number;
    }) => void;
    'battle:timer_sync': (payload: {
        battleId: string;
        secondsRemaining: number;
        serverTime: string;
    }) => void;
    'battle:completed': (payload: {
        battleId: string;
        winnerId: string | null;
        isDraw: boolean;
    }) => void;
    'submission:queued': (payload: {
        submissionId: string;
        battleId: string;
    }) => void;
    'submission:verdict': (payload: {
        submissionId: string;
        battleId: string | null;
        userId: string;
        verdict: SubmissionVerdict;
        score: number;
    }) => void;
    'opponent:status': (payload: {
        battleId: string;
        userId: string;
        status: ParticipantStatus;
    }) => void;
    'opponent:disconnected': (payload: {
        battleId: string;
        userId: string;
        gracePeriodSeconds: number;
    }) => void;
    'opponent:reconnected': (payload: {
        battleId: string;
        userId: string;
    }) => void;
    'matchmaking:found': (payload: {
        battleId: string;
        inviteCode: string;
    }) => void;
    'matchmaking:cancelled': (payload: {
        reason: string;
    }) => void;
    'notification': (payload: {
        type: string;
        message: string;
        data?: unknown;
    }) => void;
    'error': (payload: {
        code: string;
        message: string;
    }) => void;
}
export interface ClientToServerEvents {
    'battle:join': (payload: {
        battleId?: string;
        inviteCode?: string;
    }, callback: (err: string | null, data?: {
        battleId: string;
    }) => void) => void;
    'battle:leave': (payload: {
        battleId: string;
    }) => void;
    'battle:ready': (payload: {
        battleId: string;
    }, callback?: (err: string | null) => void) => void;
    'battle:unready': (payload: {
        battleId: string;
    }, callback?: (err: string | null) => void) => void;
    'battle:status_update': (payload: {
        battleId: string;
        status: ParticipantStatus;
    }) => void;
    'matchmaking:join': (payload: {
        difficulty: string;
        scoringMode: string;
    }) => void;
    'matchmaking:cancel': () => void;
}
export interface InterServerEvents {
    ping: () => void;
}
export interface SocketData {
    userId: string;
    username: string;
    role: string;
}
