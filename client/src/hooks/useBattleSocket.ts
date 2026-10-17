import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from './useSocket';
import { useBattleStore } from '../store/battleStore';
import { problemApi } from '../api/problem.api';

export function useBattleSocket(battleId: string | undefined) {
  const { battle, updateParticipant, updateState, setSecondsRemaining, setProblem } =
    useBattleStore();
  const navigate = useNavigate();

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

  // Load problem when battle becomes ACTIVE
  useEffect(() => {
    if (battle?.state === 'ACTIVE' && battle.problemId) {
      problemApi.get(battle.problemId).then(setProblem).catch(console.error);
    }
  }, [battle?.state, battle?.problemId]);
}
