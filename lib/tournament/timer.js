import { DeadlineExpiredError } from '../utils/errors';
export function createTimer(durationSeconds) {
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);
    return {
        startedAt,
        duration: durationSeconds,
        deadlineAt,
    };
}
export function getRemainingSeconds(deadlineAt) {
    const now = Date.now();
    const deadline = new Date(deadlineAt).getTime();
    const remaining = Math.max(0, deadline - now);
    return Math.ceil(remaining / 1000);
}
export function hasExpired(deadlineAt) {
    return getRemainingSeconds(deadlineAt) === 0;
}
export function validateDeadline(deadlineAt) {
    if (!deadlineAt) {
        throw new Error('No deadline set');
    }
    if (hasExpired(deadlineAt)) {
        throw new DeadlineExpiredError('Deadline has expired');
    }
}
export function formatTimeRemaining(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
