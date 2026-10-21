import type { BattleState } from '@code-wars/shared';
export interface InviteBattle {
    state: BattleState;
    isPrivate: boolean;
    inviteExpiresAt?: Date | string | null;
    participants: Array<{
        userId: {
            toString(): string;
        } | string;
    }>;
}
export interface InviteError {
    code: string;
    message: string;
    status: number;
}
export declare function getInviteError(battle: InviteBattle, userId: string, now?: Date): InviteError | null;
