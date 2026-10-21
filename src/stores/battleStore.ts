import { create } from 'zustand';
import type { Battle, BattleState, BattleParticipant, Problem } from '../types';
import { getRemainingBattleSeconds } from '../utils/battleTimer';

interface BattleStoreState {
  battle: Battle | null;
  problem: Problem | null;
  secondsRemaining: number;
  isMatchmaking: boolean;
  matchmakingDifficulty: string;

  setBattle: (battle: Battle | null) => void;
  setProblem: (problem: Problem | null) => void;
  updateParticipant: (participant: BattleParticipant) => void;
  updateState: (state: BattleState, startTime?: string, endTime?: string) => void;
  setSecondsRemaining: (seconds: number) => void;
  setMatchmaking: (active: boolean, difficulty?: string) => void;
  reset: () => void;
}

export const useBattleStore = create<BattleStoreState>((set) => ({
  battle: null,
  problem: null,
  secondsRemaining: 0,
  isMatchmaking: false,
  matchmakingDifficulty: 'medium',

  setBattle: (battle) => set({
    battle,
    secondsRemaining: battle?.endTime && battle.state === 'ACTIVE'
      ? getRemainingBattleSeconds(battle.endTime)
      : battle?.state === 'COMPLETED' || battle?.state === 'CANCELLED' || battle?.state === 'FINALIZING'
        ? 0
        : 0,
  }),
  setProblem: (problem) => set({ problem }),

  updateParticipant: (participant) =>
    set((state) => {
      if (!state.battle) return state;
      const exists = state.battle.participants.some((p) => p.userId === participant.userId);
      const participants = exists
        ? state.battle.participants.map((p) =>
          p.userId === participant.userId ? { ...p, ...participant } : p,
        )
        : [...state.battle.participants, participant];
      return { battle: { ...state.battle, participants } };
    }),

  updateState: (battleState, startTime, endTime) =>
    set((state) => {
      if (!state.battle) return state;
      return {
        battle: {
          ...state.battle,
          state: battleState,
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
        },
        secondsRemaining: battleState === 'ACTIVE' && endTime
          ? Math.max(0, Math.ceil((new Date(endTime).getTime() - Date.now()) / 1000))
          : ['COMPLETED', 'CANCELLED', 'FINALIZING'].includes(battleState) ? 0 : state.secondsRemaining,
      };
    }),

  setSecondsRemaining: (seconds) => set({ secondsRemaining: seconds }),

  setMatchmaking: (active, difficulty) =>
    set({ isMatchmaking: active, ...(difficulty && { matchmakingDifficulty: difficulty }) }),

  reset: () => set({ battle: null, problem: null, secondsRemaining: 0, isMatchmaking: false }),
}));
