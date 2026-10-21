import type { SubmissionVerdict } from '@code-wars/shared';
import type { Server as SocketServer } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@code-wars/shared';
declare class ScoringService {
    handleSubmissionResult(battleId: string, userId: string, submissionId: string, verdict: SubmissionVerdict, score: number, submittedAt: Date, io?: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
    checkFinalization(battleId: string, io?: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
    finalizeBattle(battleId: string, forcedWinnerId: string | null, forcedDraw: boolean, io?: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
}
export declare const scoringService: ScoringService;
export {};
