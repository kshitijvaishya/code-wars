import type { Server as SocketServer } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@code-wars/shared';
export declare function runCode(userId: string, problemId: string, languageId: number, sourceCode: string, customInput?: string): Promise<unknown>;
export declare function submitCode(userId: string, problemId: string, battleId: string | null, languageId: number, sourceCode: string, io?: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<{
    submissionId: string;
}>;
