import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Battle } from '../src/models/Battle';
import { User } from '../src/models/User';
import { BattleService } from '../src/services/battle.service';
import { getInviteError } from '../src/utils/battleInvite';

const service = new BattleService();
const future = new Date(Date.now() + 60 * 60 * 1000);

function battleFixture(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'battle-id' },
    inviteCode: 'A1B2C3D4E5F6A7B8',
    inviteExpiresAt: future,
    state: 'WAITING',
    isPrivate: true,
    difficulty: 'medium',
    participants: [{
      userId: { toString: () => 'host-id' },
      username: 'host',
      isReady: false,
    }],
    ...overrides,
  };
}

describe('private battle invite codes', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('creates a unique private invite and sets its 24-hour expiry', async () => {
    const user = { _id: 'host-id', username: 'host', avatarUrl: null, rating: 1200 };
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue(user),
    } as never);

    const created = battleFixture();
    const create = vi.spyOn(Battle, 'create')
      .mockRejectedValueOnce({ code: 11000 })
      .mockResolvedValueOnce(created as never);

    const before = Date.now();
    const result = await service.createPrivateBattle('host-id', {
      difficulty: 'medium',
      scoringMode: 'first_accepted',
    });

    const firstCode = create.mock.calls[0][0].inviteCode;
    const secondCode = create.mock.calls[1][0].inviteCode;
    expect(firstCode).toMatch(/^[A-F0-9]{16}$/);
    expect(secondCode).toMatch(/^[A-F0-9]{16}$/);
    expect(secondCode).not.toBe(firstCode);
    expect(create.mock.calls[1][0].inviteExpiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 24 * 60 * 60 * 1000,
    );
    expect(result).toBe(created);
  });

  it('reports invalid, expired, already-started, own, and full invites', () => {
    const base = battleFixture();
    expect(getInviteError({ ...base, isPrivate: false }, 'guest-id')?.code).toBe('INVALID_INVITE');
    expect(getInviteError({ ...base, inviteExpiresAt: new Date(Date.now() - 1) }, 'guest-id')?.code)
      .toBe('INVITE_EXPIRED');
    expect(getInviteError({ ...base, state: 'ACTIVE' }, 'guest-id')?.code)
      .toBe('BATTLE_ALREADY_STARTED');
    expect(getInviteError(base, 'host-id')?.code).toBe('OWN_BATTLE_INVITE');
    expect(getInviteError({
      ...base,
      state: 'READY_CHECK',
      participants: [...base.participants, { userId: { toString: () => 'other-id' } }],
    }, 'guest-id')?.code).toBe('BATTLE_FULL');
  });

  it('adds a second account atomically and transitions to ready check', async () => {
    const initial = battleFixture();
    const joined = battleFixture({
      state: 'READY_CHECK',
      participants: [
        ...initial.participants,
        { userId: { toString: () => 'guest-id' }, username: 'guest', isReady: false },
      ],
    });
    vi.spyOn(Battle, 'findOne').mockResolvedValue(initial as never);
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: { toString: () => 'guest-id' },
        username: 'guest',
        avatarUrl: null,
        rating: 1250,
      }),
    } as never);
    const atomicJoin = vi.spyOn(Battle, 'findOneAndUpdate').mockResolvedValue(joined as never);

    const result = await service.joinBattle(null, 'a1b2c3d4e5f6a7b8', 'guest-id', 'guest-socket');

    expect(atomicJoin).toHaveBeenCalledOnce();
    expect(atomicJoin.mock.calls[0][0]).toMatchObject({
      state: 'WAITING',
      'participants.userId': { $ne: expect.anything() },
      $expr: expect.any(Object),
    });
    expect(atomicJoin.mock.calls[0][1]).toMatchObject({
      $set: { state: 'READY_CHECK' },
    });
    expect(atomicJoin.mock.calls[0][1].$push.participants.username).toBe('guest');
    expect(result.state).toBe('READY_CHECK');
    expect(result.participants).toHaveLength(2);
  });

  it('does not let concurrent users claim the same waiting slot', async () => {
    const initial = battleFixture();
    const joined = battleFixture({
      state: 'READY_CHECK',
      participants: [
        ...initial.participants,
        { userId: { toString: () => 'guest-one' }, username: 'guest-one', isReady: false },
      ],
    });
    vi.spyOn(Battle, 'findOne').mockResolvedValue(initial as never);
    vi.spyOn(User, 'findById').mockImplementation(((userId: string) => ({
      select: vi.fn().mockResolvedValue({
        _id: { toString: () => userId },
        username: userId,
        avatarUrl: null,
        rating: 1200,
      }),
    })) as never);
    vi.spyOn(Battle, 'findOneAndUpdate')
      .mockResolvedValueOnce(joined as never)
      .mockResolvedValueOnce(null);
    vi.spyOn(Battle, 'findById').mockResolvedValue(joined as never);

    const results = await Promise.allSettled([
      service.joinBattle(null, 'A1B2C3D4E5F6A7B8', 'guest-one', 'socket-one'),
      service.joinBattle(null, 'A1B2C3D4E5F6A7B8', 'guest-two', 'socket-two'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });
});
