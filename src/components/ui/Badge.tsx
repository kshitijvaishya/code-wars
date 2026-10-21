import { clsx } from 'clsx';
import type { Difficulty, SubmissionVerdict } from '../../types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <span className={clsx('badge', {
      'badge-easy': difficulty === 'easy',
      'badge-medium': difficulty === 'medium',
      'badge-hard': difficulty === 'hard',
    })}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}

interface VerdictBadgeProps {
  verdict: SubmissionVerdict;
  className?: string;
}

const VERDICT_LABELS: Record<SubmissionVerdict, string> = {
  ACCEPTED: '✓ Accepted',
  WRONG_ANSWER: '✗ Wrong Answer',
  PARTIAL_SCORE: '~ Partial',
  COMPILATION_ERROR: '⊘ Compile Error',
  RUNTIME_ERROR: '⚠ Runtime Error',
  TIME_LIMIT_EXCEEDED: '⏱ Time Limit',
  MEMORY_LIMIT_EXCEEDED: '💾 Memory Limit',
  INTERNAL_ERROR: '⚡ Internal Error',
  PENDING: '◷ Pending',
  PROCESSING: '⟳ Processing',
};

const VERDICT_STYLES: Record<SubmissionVerdict, string> = {
  ACCEPTED: 'bg-green-900/40 text-green-400 border border-green-800/50',
  WRONG_ANSWER: 'bg-red-900/40 text-red-400 border border-red-800/50',
  PARTIAL_SCORE: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  COMPILATION_ERROR: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  RUNTIME_ERROR: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  TIME_LIMIT_EXCEEDED: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
  MEMORY_LIMIT_EXCEEDED: 'bg-purple-900/40 text-purple-400 border border-purple-800/50',
  INTERNAL_ERROR: 'bg-gray-800 text-gray-400 border border-gray-700',
  PENDING: 'bg-gray-800 text-gray-400 border border-gray-700',
  PROCESSING: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
};

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  return (
    <span className={clsx('badge', VERDICT_STYLES[verdict], className)}>
      {VERDICT_LABELS[verdict]}
    </span>
  );
}
