import type { ScoringMode } from '@code-wars/shared';
import type { Server as SocketServer } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@code-wars/shared';
declare class MatchmakingService {
    private queue;
    joinQueue(userId: string, username: string, rating: number, difficulty: 'easy' | 'medium' | 'hard', scoringMode: ScoringMode, socketId: string, io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
    leaveQueue(userId: string): void;
    private tryMatch;
    private createMatch;
    getQueueLength(): number;
}
export declare const matchmakingService: MatchmakingService;
export {};
