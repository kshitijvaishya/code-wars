import type { BattleState } from '@code-wars/shared';

export interface InviteBattle {
  state: BattleState;
  isPrivate: boolean;
  inviteExpiresAt?: Date | string | null;
  participants: Array<{ userId: { toString(): string } | string }>;
}

export interface InviteError {
  code: string;
  message: string;
  status: number;
}

export function getInviteError(
  battle: InviteBattle,
  userId: string,
  now = new Date(),
): InviteError | null {
  if (!battle.isPrivate) {
    return { code: 'INVALID_INVITE', message: 'This invite code is not valid for a private battle', status: 404 };
  }

  if (battle.state === 'WAITING' && battle.inviteExpiresAt && new Date(battle.inviteExpiresAt) <= now) {
    return { code: 'INVITE_EXPIRED', message: 'This invite code has expired', status: 410 };
  }

  if (!['WAITING', 'READY_CHECK'].includes(battle.state)) {
    return { code: 'BATTLE_ALREADY_STARTED', message: 'This battle has already started or ended', status: 409 };
  }

  if (battle.participants.some((participant) => participant.userId.toString() === userId)) {
    const isCreator = battle.participants[0]?.userId.toString() === userId;
    return isCreator
      ? { code: 'OWN_BATTLE_INVITE', message: 'You cannot join your own battle using its invite code', status: 409 }
      : { code: 'ALREADY_JOINED', message: 'You have already joined this battle', status: 409 };
  }

  if (battle.participants.length >= 2 || battle.state === 'READY_CHECK') {
    return { code: 'BATTLE_FULL', message: 'This battle already has two players', status: 409 };
  }

  return null;
}
