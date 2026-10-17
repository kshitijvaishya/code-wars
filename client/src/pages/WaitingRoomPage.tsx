import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBattleStore } from '../store/battleStore';
import { battleApi } from '../api/battle.api';
import { getSocket } from '../hooks/useSocket';
import type { Battle } from '../types';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function WaitingRoomPage() {
  const { code, battleId: routeBattleId } = useParams<{ code?: string; battleId?: string }>();
  const { user } = useAuthStore();
  const { battle, setBattle, updateParticipant, updateState, secondsRemaining } = useBattleStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load battle
  useEffect(() => {
    const load = async () => {
      try {
        let b: Battle;
        if (code) {
          b = await battleApi.getByInviteCode(code);
        } else if (routeBattleId) {
          b = await battleApi.get(routeBattleId);
        } else {
          navigate('/dashboard');
          return;
        }
        setBattle(b);

        // If battle is already active, go to arena
        if (b.state === 'ACTIVE' || b.state === 'COUNTDOWN') {
          navigate(`/battle/${b.id}`);
          return;
        }
      } catch {
        toast.error('Battle not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code, routeBattleId]);

  // Join via socket
  const joinBattle = async () => {
    if (!battle) return;
    const socket = getSocket();
    if (!socket?.connected) {
      toast.error('Socket not connected');
      return;
    }
    setJoining(true);
    socket.emit('battle:join', { battleId: battle.id }, (err: string | null, data?: { battleId: string }) => {
      setJoining(false);
      if (err) {
        toast.error(err);
        return;
      }
      toast.success('Joined battle!');
    });
  };

  // Navigate to arena when battle becomes ACTIVE
  useEffect(() => {
    if (battle?.state === 'ACTIVE' && battle.id) {
      navigate(`/battle/${battle.id}`);
    }
  }, [battle?.state]);

  const setReady = (ready: boolean) => {
    if (!battle) return;
    const socket = getSocket();
    if (ready) socket?.emit('battle:ready', { battleId: battle.id });
    else socket?.emit('battle:unready', { battleId: battle.id });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/battle/join/${battle?.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;
  if (!battle) return null;

  const me = battle.participants.find((p) => p.userId === user?.id);
  const opponent = battle.participants.find((p) => p.userId !== user?.id);
  const isJoined = !!me;
  const bothJoined = battle.participants.length === 2;
  const bothReady = bothJoined && battle.participants.every((p) => p.isReady);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-4 ${
          battle.state === 'COUNTDOWN' ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' :
          battle.state === 'READY_CHECK' ? 'bg-brand-900/50 text-brand-300 border border-brand-700/50' :
          'bg-dark-700 text-gray-400 border border-dark-500'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {battle.state === 'WAITING' ? 'Waiting for opponent' :
           battle.state === 'READY_CHECK' ? 'Ready check' :
           battle.state === 'COUNTDOWN' ? 'Starting...' : battle.state}
        </span>
        <h1 className="text-2xl font-bold">Battle Room</h1>
      </div>

      {/* Countdown overlay */}
      {battle.state === 'COUNTDOWN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-8xl font-black text-brand-400 font-mono animate-pulse">
              {secondsRemaining}
            </div>
            <p className="text-xl text-gray-300 mt-4">Get ready!</p>
          </div>
        </div>
      )}

      {/* Players */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <PlayerCard
          player={me}
          label="You"
          isEmpty={!me}
          isMe={true}
        />
        <PlayerCard
          player={opponent}
          label="Opponent"
          isEmpty={!opponent}
          isMe={false}
        />
      </div>

      {/* Invite code */}
      {battle.isPrivate && (
        <div className="card p-4 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Invite Code</p>
          <div className="font-mono text-3xl font-bold tracking-widest text-brand-400 mb-3">
            {battle.inviteCode}
          </div>
          <button onClick={copyInviteLink} className="btn-secondary text-sm">
            {copied ? '✓ Copied!' : '📋 Copy invite link'}
          </button>
        </div>
      )}

      {/* Battle info */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          ['Difficulty', battle.difficulty.charAt(0).toUpperCase() + battle.difficulty.slice(1)],
          ['Scoring', battle.scoringMode.replace(/_/g, ' ')],
          ['Duration', `${Math.floor(battle.durationSeconds / 60)}m`],
        ].map(([label, val]) => (
          <div key={label} className="card p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-sm font-semibold text-gray-200 capitalize">{val}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {!isJoined ? (
        <button onClick={joinBattle} disabled={joining} className="btn-primary w-full py-3 text-base">
          {joining ? <Spinner size="sm" /> : 'Join Battle'}
        </button>
      ) : battle.state === 'READY_CHECK' ? (
        <div className="space-y-3">
          {!me?.isReady ? (
            <button onClick={() => setReady(true)} className="btn-success w-full py-3 text-base">
              ✓ I'm Ready!
            </button>
          ) : (
            <button onClick={() => setReady(false)} className="btn-secondary w-full py-3 text-base">
              ✗ Not Ready
            </button>
          )}
          {bothReady && (
            <p className="text-center text-accent-green text-sm animate-pulse">
              Both players ready — starting countdown!
            </p>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm">
          {battle.state === 'WAITING' ? 'Waiting for second player to join...' : ''}
        </p>
      )}
    </div>
  );
}

function PlayerCard({
  player,
  label,
  isEmpty,
  isMe,
}: {
  player?: { userId: string; username: string; avatarUrl: string | null; rating: number; isReady: boolean; status: string } | undefined;
  label: string;
  isEmpty: boolean;
  isMe: boolean;
}) {
  return (
    <div className={`card p-4 text-center transition-all ${
      player?.isReady ? 'border-accent-green/50 bg-accent-green/5' : ''
    }`}>
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-dark-400 flex items-center justify-center text-dark-300 text-lg">?</div>
          <span className="text-xs text-gray-500">Waiting...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-brand-700 flex items-center justify-center text-lg font-bold overflow-hidden">
            {player?.avatarUrl ? (
              <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
            ) : (
              player?.username[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-100">{player?.username}</div>
            <div className="text-xs text-brand-400 font-mono">{player?.rating}</div>
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full ${
            player?.isReady
              ? 'bg-accent-green/20 text-accent-green'
              : 'bg-dark-600 text-gray-400'
          }`}>
            {player?.isReady ? '✓ Ready' : 'Not ready'}
          </div>
        </div>
      )}
    </div>
  );
}
