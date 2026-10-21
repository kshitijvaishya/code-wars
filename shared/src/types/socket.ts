import type { BattleState, BattleParticipant, ParticipantStatus } from './battle';
import type { SubmissionVerdict } from './submission';

// ── Server → Client events ──────────────────────────────────────────────────
export interface ServerToClientEvents {
  // Battle room lifecycle
  'battle:joined': (payload: { battleId: string; inviteCode: string }) => void;
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
  'battle:countdown': (payload: { battleId: string; secondsRemaining: number }) => void;
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

  // Submissions
  'submission:queued': (payload: { submissionId: string; battleId: string }) => void;
  'submission:verdict': (payload: {
    submissionId: string;
    battleId: string | null;
    userId: string;
    verdict: SubmissionVerdict;
    score: number;
  }) => void;

  // Opponent status
  'opponent:status': (payload: {
    battleId: string;
    userId: string;
    status: ParticipantStatus;
  }) => void;
  'opponent:disconnected': (payload: { battleId: string; userId: string; gracePeriodSeconds: number }) => void;
  'opponent:reconnected': (payload: { battleId: string; userId: string }) => void;

  // Matchmaking
  'matchmaking:found': (payload: { battleId: string; inviteCode: string }) => void;
  'matchmaking:cancelled': (payload: { reason: string }) => void;

  // Notifications
  'notification': (payload: { type: string; message: string; data?: unknown }) => void;

  // Errors
  'error': (payload: { code: string; message: string }) => void;
}

// ── Client → Server events ──────────────────────────────────────────────────
export interface ClientToServerEvents {
  // Battle
  'battle:join': (payload: { battleId?: string; inviteCode?: string }, callback: (err: string | null, data?: { battleId: string }) => void) => void;
  'battle:leave': (payload: { battleId: string }) => void;
  'battle:ready': (payload: { battleId: string }, callback?: (err: string | null) => void) => void;
  'battle:unready': (payload: { battleId: string }, callback?: (err: string | null) => void) => void;
  'battle:status_update': (payload: { battleId: string; status: ParticipantStatus }) => void;

  // Matchmaking
  'matchmaking:join': (payload: { difficulty: string; scoringMode: string }) => void;
  'matchmaking:cancel': () => void;
}

// ── Inter-server events (for scaling) ───────────────────────────────────────
export interface InterServerEvents {
  ping: () => void;
}

// ── Socket data ─────────────────────────────────────────────────────────────
export interface SocketData {
  userId: string;
  username: string;
  role: string;
}
