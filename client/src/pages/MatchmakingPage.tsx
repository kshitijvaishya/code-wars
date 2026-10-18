import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBattleStore } from '../store/battleStore';
import { getSocket } from '../hooks/useSocket';
import { battleApi } from '../api/battle.api';
import toast from 'react-hot-toast';
import type { ScoringMode } from '../types';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'text-accent-green', desc: '~10–30 min' },
  { value: 'medium', label: 'Medium', color: 'text-accent-yellow', desc: '~20–45 min' },
  { value: 'hard', label: 'Hard', color: 'text-accent-red', desc: '~30–60 min' },
];

const SCORING_MODES: { value: ScoringMode; label: string; desc: string }[] = [
  { value: 'first_accepted', label: 'First Accepted', desc: 'First full solution wins' },
  { value: 'score_based', label: 'Score Based', desc: 'Most test cases passed wins' },
  { value: 'time_based', label: 'Time Based', desc: 'Highest score, then fastest' },
];

export default function MatchmakingPage() {
  const { user } = useAuthStore();
  const { isMatchmaking, setMatchmaking } = useBattleStore();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('medium');
  const [scoringMode, setScoringMode] = useState<ScoringMode>('first_accepted');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isMatchmaking) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [isMatchmaking]);

  const startMatchmaking = () => {
    const socket = getSocket();
    if (!socket?.connected) {
      toast.error('Not connected. Please wait and try again.');
      return;
    }
    setMatchmaking(true, difficulty);
    socket.emit('matchmaking:join', { difficulty, scoringMode });
    toast('🔍 Searching for an opponent...', { duration: 3000 });
  };

  const cancelMatchmaking = () => {
    const socket = getSocket();
    socket?.emit('matchmaking:cancel', undefined);
    setMatchmaking(false);
    setElapsed(0);
    toast('Matchmaking cancelled');
  };

  const createPrivateBattle = async () => {
    try {
      const result = await battleApi.create({ difficulty, scoringMode });
      toast.success('Private battle created!');
      navigate(`/battle/join/${result.inviteCode}`);
    } catch {
      toast.error('Failed to create battle');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">⚔️ Find a Battle</h1>
        <p className="text-gray-400">Choose your settings and jump into a match</p>
      </div>

      {isMatchmaking ? (
        <div className="card p-10 text-center animate-fade-in">
          <div className="relative inline-flex mb-6">
            <div className="w-20 h-20 rounded-full bg-brand-900/50 border-2 border-brand-500 flex items-center justify-center text-3xl">
              ⚔️
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-brand-500 animate-ping opacity-30" />
          </div>

          <h2 className="text-xl font-semibold mb-2">Searching for opponent...</h2>
          <p className="text-gray-400 mb-1">
            Difficulty: <span className="text-brand-400">{difficulty}</span> ·{' '}
            Mode: <span className="text-brand-400">{scoringMode.replace(/_/g, ' ')}</span>
          </p>
          <p className="text-gray-500 font-mono text-2xl mt-4">
            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
          </p>

          <button onClick={cancelMatchmaking} className="btn-secondary mt-8 px-8">
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Difficulty */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Difficulty</h2>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    difficulty === d.value
                      ? 'border-brand-500 bg-brand-900/30'
                      : 'border-dark-500 hover:border-dark-400 bg-dark-700'
                  }`}
                >
                  <div className={`font-semibold ${d.color}`}>{d.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scoring mode */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Scoring Mode</h2>
            <div className="space-y-2">
              {SCORING_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setScoringMode(m.value)}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                    scoringMode === m.value
                      ? 'border-brand-500 bg-brand-900/30'
                      : 'border-dark-500 hover:border-dark-400 bg-dark-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    scoringMode === m.value ? 'border-brand-400 bg-brand-500' : 'border-dark-300'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-gray-200">{m.label}</div>
                    <div className="text-xs text-gray-500">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Your rating */}
          <div className="flex items-center justify-between px-4 py-3 bg-dark-800 rounded-lg border border-dark-600">
            <span className="text-sm text-gray-400">Your rating</span>
            <span className="font-bold text-brand-400 font-mono">{user?.rating ?? '—'}</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={startMatchmaking} className="btn-primary py-3 text-base">
              ⚡ Quick Match
            </button>
            <button onClick={createPrivateBattle} className="btn-secondary py-3 text-base">
              🔒 Private Battle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
