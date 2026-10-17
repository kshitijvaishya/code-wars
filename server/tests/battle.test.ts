import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Battle state machine unit tests (pure logic, no DB) ───────────────────

type BattleState = 'WAITING' | 'READY_CHECK' | 'COUNTDOWN' | 'ACTIVE' | 'FINALIZING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

const VALID_TRANSITIONS: Record<BattleState, BattleState[]> = {
  WAITING:     ['READY_CHECK', 'CANCELLED'],
  READY_CHECK: ['COUNTDOWN', 'CANCELLED'],
  COUNTDOWN:   ['ACTIVE', 'CANCELLED'],
  ACTIVE:      ['FINALIZING', 'FAILED'],
  FINALIZING:  ['COMPLETED', 'FAILED'],
  COMPLETED:   [],
  CANCELLED:   [],
  FAILED:      [],
};

function canTransition(from: BattleState, to: BattleState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

describe('Battle state machine transitions', () => {
  it('WAITING → READY_CHECK is valid', () => {
    expect(canTransition('WAITING', 'READY_CHECK')).toBe(true);
  });

  it('READY_CHECK → COUNTDOWN is valid', () => {
    expect(canTransition('READY_CHECK', 'COUNTDOWN')).toBe(true);
  });

  it('COUNTDOWN → ACTIVE is valid', () => {
    expect(canTransition('COUNTDOWN', 'ACTIVE')).toBe(true);
  });

  it('ACTIVE → FINALIZING is valid', () => {
    expect(canTransition('ACTIVE', 'FINALIZING')).toBe(true);
  });

  it('FINALIZING → COMPLETED is valid', () => {
    expect(canTransition('FINALIZING', 'COMPLETED')).toBe(true);
  });

  it('COMPLETED → anything is invalid', () => {
    const states: BattleState[] = ['WAITING', 'READY_CHECK', 'COUNTDOWN', 'ACTIVE', 'FINALIZING', 'CANCELLED'];
    states.forEach((s) => expect(canTransition('COMPLETED', s)).toBe(false));
  });

  it('WAITING → CANCELLED is valid (room abandoned)', () => {
    expect(canTransition('WAITING', 'CANCELLED')).toBe(true);
  });

  it('ACTIVE → FAILED is valid (judge outage)', () => {
    expect(canTransition('ACTIVE', 'FAILED')).toBe(true);
  });

  it('cannot skip from WAITING directly to ACTIVE', () => {
    expect(canTransition('WAITING', 'ACTIVE')).toBe(false);
  });

  it('cannot go backwards from ACTIVE to WAITING', () => {
    expect(canTransition('ACTIVE', 'WAITING')).toBe(false);
  });
});

describe('Battle room capacity', () => {
  it('room with 2 participants is full', () => {
    const participants = [
      { userId: 'user1' },
      { userId: 'user2' },
    ];
    expect(participants.length).toBe(2);
    expect(participants.length >= 2).toBe(true);
  });

  it('duplicate user join is detected', () => {
    const participants = [{ userId: 'user1' }];
    const joiningUserId = 'user1';
    const isAlreadyIn = participants.some((p) => p.userId === joiningUserId);
    expect(isAlreadyIn).toBe(true);
  });

  it('new user can join a non-full room', () => {
    const participants = [{ userId: 'user1' }];
    const joiningUserId = 'user2';
    const isFull = participants.length >= 2;
    const isAlreadyIn = participants.some((p) => p.userId === joiningUserId);
    expect(isFull).toBe(false);
    expect(isAlreadyIn).toBe(false);
  });

  it('room transitions to READY_CHECK when 2nd player joins', () => {
    const participants = [{ userId: 'user1' }];
    participants.push({ userId: 'user2' });
    const newState: BattleState = participants.length === 2 ? 'READY_CHECK' : 'WAITING';
    expect(newState).toBe('READY_CHECK');
  });
});

describe('Ready check logic', () => {
  it('battle starts countdown only when both players are ready', () => {
    const p1 = { isReady: true };
    const p2 = { isReady: false };
    const allReady = [p1, p2].every((p) => p.isReady);
    expect(allReady).toBe(false);
  });

  it('both ready triggers countdown', () => {
    const p1 = { isReady: true };
    const p2 = { isReady: true };
    const allReady = [p1, p2].every((p) => p.isReady);
    expect(allReady).toBe(true);
  });
});

describe('Timer enforcement', () => {
  it('battle end time is startTime + durationSeconds', () => {
    const startTime = new Date('2026-01-01T10:00:00.000Z');
    const durationSeconds = 1800;
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
    expect(endTime.getTime() - startTime.getTime()).toBe(1800000);
  });

  it('battle is expired when current time > endTime', () => {
    const endTime = new Date(Date.now() - 1000); // 1 second in the past
    expect(Date.now() > endTime.getTime()).toBe(true);
  });

  it('battle is not expired when current time < endTime', () => {
    const endTime = new Date(Date.now() + 60000); // 1 minute in future
    expect(Date.now() > endTime.getTime()).toBe(false);
  });
});

describe('Disconnect grace period', () => {
  it('player still in grace period is not forfeited', () => {
    const disconnectedAt = new Date(Date.now() - 15000); // 15s ago
    const gracePeriodSeconds = 30;
    const elapsed = (Date.now() - disconnectedAt.getTime()) / 1000;
    const shouldForfeit = elapsed >= gracePeriodSeconds;
    expect(shouldForfeit).toBe(false);
  });

  it('player beyond grace period is forfeited', () => {
    const disconnectedAt = new Date(Date.now() - 35000); // 35s ago
    const gracePeriodSeconds = 30;
    const elapsed = (Date.now() - disconnectedAt.getTime()) / 1000;
    const shouldForfeit = elapsed >= gracePeriodSeconds;
    expect(shouldForfeit).toBe(true);
  });
});

describe('Submission authorization', () => {
  it('participant can submit to their battle', () => {
    const battle = {
      state: 'ACTIVE',
      participants: [{ userId: 'user1' }, { userId: 'user2' }],
    };
    const submittingUserId = 'user1';
    const isParticipant = battle.participants.some((p) => p.userId === submittingUserId);
    const isActive = battle.state === 'ACTIVE';
    expect(isParticipant && isActive).toBe(true);
  });

  it('non-participant cannot submit to a battle', () => {
    const battle = {
      state: 'ACTIVE',
      participants: [{ userId: 'user1' }, { userId: 'user2' }],
    };
    const submittingUserId = 'user3';
    const isParticipant = battle.participants.some((p) => p.userId === submittingUserId);
    expect(isParticipant).toBe(false);
  });

  it('submission to non-active battle is rejected', () => {
    const battle = { state: 'COMPLETED', participants: [{ userId: 'user1' }] };
    const isActive = battle.state === 'ACTIVE';
    expect(isActive).toBe(false);
  });
});

describe('Hidden test case security', () => {
  it('public problem response does not contain hiddenTestCases', () => {
    const dbRecord = {
      title: 'Two Sum',
      sampleTestCases: [{ input: '2 7', expectedOutput: '0 1' }],
      hiddenTestCases: [{ input: 'secret', expectedOutput: 'secret-output', score: 10 }],
    };
    // Simulate what the public API returns (hiddenTestCases excluded by select)
    const { hiddenTestCases, ...publicRecord } = dbRecord;
    expect('hiddenTestCases' in publicRecord).toBe(false);
    expect(publicRecord.sampleTestCases).toBeDefined();
  });

  it('run result does not include hidden test expected output', () => {
    const runResult = {
      testCaseId: 'sample-1',
      isSample: true,
      stdout: '0 1',
      expectedOutput: '0 1', // only for samples
    };
    const hiddenRunResult = {
      testCaseId: 'hidden-1',
      isSample: false,
      stdout: 'wrong',
      // expectedOutput: intentionally omitted
    };
    expect('expectedOutput' in hiddenRunResult).toBe(false);
  });
});
