import { clsx } from 'clsx';
import type { BattleParticipant } from '../../types';

interface OpponentStatusProps {
  opponent: BattleParticipant | undefined;
  me: BattleParticipant | undefined;
  secondsRemaining: number;
}

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Waiting...',
  connected: 'Connected',
  ready: 'Ready',
  coding: '✏️ Coding',
  submitted: '📨 Submitted',
  disconnected: '⚠️ Disconnected',
};

const STATUS_COLORS: Record<string, string> = {
  waiting: 'text-gray-400',
  connected: 'text-blue-400',
  ready: 'text-green-400',
  coding: 'text-brand-400',
  submitted: 'text-accent-purple',
  disconnected: 'text-accent-red',
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function OpponentStatus({ opponent, me, secondsRemaining }: OpponentStatusProps) {
  const isLow = secondsRemaining > 0 && secondsRemaining < 60;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-600 text-sm">
      {/* Timer */}
      <div className={clsx(
        'font-mono font-bold text-lg tabular-nums',
        isLow ? 'text-accent-red animate-pulse' : 'text-gray-200',
      )}>
        {secondsRemaining > 0 ? formatTime(secondsRemaining) : '--:--'}
      </div>

      {/* Players */}
      <div className="flex items-center gap-6">
        {/* Me */}
        {me && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold">
              {me.username[0].toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-200">{me.username}</div>
              <div className="text-xs text-gray-500 font-mono">{me.score} pts</div>
            </div>
          </div>
        )}

        <span className="text-gray-600 font-bold">VS</span>

        {/* Opponent */}
        {opponent ? (
          <div className="flex items-center gap-2">
            <div className={clsx('text-xs font-medium', STATUS_COLORS[opponent.status])}>
              {STATUS_LABELS[opponent.status]}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-200">{opponent.username}</div>
              <div className="text-xs text-gray-500 font-mono">{opponent.score} pts</div>
            </div>
            <div className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              opponent.status === 'disconnected' ? 'bg-dark-600 opacity-50' : 'bg-accent-red/20 border border-accent-red/30',
            )}>
              {opponent.avatarUrl ? (
                <img src={opponent.avatarUrl} alt={opponent.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                opponent.username[0].toUpperCase()
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">Waiting for opponent...</div>
        )}
      </div>
    </div>
  );
}
