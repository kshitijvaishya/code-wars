export interface Timer {
    startedAt: Date;
    duration: number;
    deadlineAt: Date;
}
export declare function createTimer(durationSeconds: number): Timer;
export declare function getRemainingSeconds(deadlineAt: Date): number;
export declare function hasExpired(deadlineAt: Date): boolean;
export declare function validateDeadline(deadlineAt: Date | undefined): void;
export declare function formatTimeRemaining(seconds: number): string;
