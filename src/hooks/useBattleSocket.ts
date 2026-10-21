import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from './useSocket';
import { useBattleStore } from '../stores/battleStore';
import { problemApi } from '../services/problem.api';

export function useBattleSocket(battleId: string | undefined) {
  const { battle, setProblem } =
    useBattleStore();
  const navigate = useNavigate();
  const [problemLoading, setProblemLoading] = useState(false);
  const [problemError, setProblemError] = useState<string | null>(null);

  useEffect(() => {
    if (!battleId) return;
    const socket = getSocket();
    if (!socket) return;

    // Submission verdict
    const handleVerdict = (payload: {
      submissionId: string;
      userId: string;
      verdict: string;
      score: number;
    }) => {
      toast(
        payload.verdict === 'ACCEPTED'
          ? `✅ Accepted! Score: ${payload.score}`
          : `❌ ${payload.verdict.replace(/_/g, ' ')}`,
        { duration: 4000 },
      );
    };

    // Battle complete → go to results
    const handleCompleted = (payload: { battleId: string; winnerId: string | null; isDraw: boolean }) => {
      if (payload.battleId === battleId) {
        setTimeout(() => navigate(`/battle/${battleId}/result`), 1500);
      }
    };

    socket.on('submission:verdict', handleVerdict);
    socket.on('battle:completed', handleCompleted);

    return () => {
      socket.off('submission:verdict', handleVerdict);
      socket.off('battle:completed', handleCompleted);
    };
  }, [battleId, navigate]);

  // Load the active problem both after the ACTIVE event and when entering an
  // already-active battle after a refresh or reconnect.
  useEffect(() => {
    if (!battle?.problemId || !['ACTIVE', 'COMPLETED', 'FINALIZING'].includes(battle.state)) return;
    setProblemLoading(true);
    setProblemError(null);
    problemApi.get(battle.problemId)
      .then(setProblem)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to load the battle problem';
        setProblemError(message);
        setProblem(null);
      })
      .finally(() => setProblemLoading(false));
  }, [battle?.problemId, battle?.state, setProblem]);

  return { problemLoading, problemError };
}
