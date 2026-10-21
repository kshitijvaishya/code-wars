import { Battle } from '../models/Battle';
import type { ScoringMode } from '@code-wars/shared';
import type { Server as SocketServer } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@code-wars/shared';
export declare class BattleService {
    createPrivateBattle(userId: string, options: {
        difficulty: 'easy' | 'medium' | 'hard';
        scoringMode: ScoringMode;
        durationSeconds?: number;
    }): Promise<InstanceType<typeof Battle>>;
    joinBattle(battleId: string | null, inviteCode: string | null, userId: string, socketId: string): Promise<InstanceType<typeof Battle>>;
    setReady(battleId: string, userId: string, isReady: boolean, io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
    startCountdown(battleId: string, io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
    startBattle(battleId: string, io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
    handleDisconnect(userId: string, socketId: string, io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void>;
    formatParticipant(p: {
        userId: {
            toString(): string;
        };
        username: string;
        avatarUrl: string | null;
        rating: number;
        status: string;
        isReady: boolean;
        score: number;
        submittedAt: Date | null;
        verdict: string | null;
    }): {
        userId: string;
        username: string;
        avatarUrl: string | null;
        rating: number;
        status: "waiting" | "connected" | "ready" | "coding" | "submitted" | "disconnected";
        isReady: boolean;
        score: number;
        submittedAt: string | null;
        verdict: string | null;
    };
}
export declare const battleService: BattleService;
