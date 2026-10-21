import { DeadlineExpiredError } from '../utils/errors';

export interface Timer {
  startedAt: Date;
  duration: number; // seconds
  deadlineAt: Date;
}

export function createTimer(durationSeconds: number): Timer {
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);
  
  return {
    startedAt,
    duration: durationSeconds,
    deadlineAt,
  };
}

export function getRemainingSeconds(deadlineAt: Date): number {
  const now = Date.now();
  const deadline = new Date(deadlineAt).getTime();
  const remaining = Math.max(0, deadline - now);
  return Math.ceil(remaining / 1000);
}

export function hasExpired(deadlineAt: Date): boolean {
  return getRemainingSeconds(deadlineAt) === 0;
}

export function validateDeadline(deadlineAt: Date | undefined): void {
  if (!deadlineAt) {
    throw new Error('No deadline set');
  }
  
  if (hasExpired(deadlineAt)) {
    throw new DeadlineExpiredError('Deadline has expired');
  }
}

export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
