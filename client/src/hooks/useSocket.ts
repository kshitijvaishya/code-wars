import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useBattleStore } from '../store/battleStore';
import toast from 'react-hot-toast';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { updateParticipant, updateState, setSecondsRemaining, setBattle, setMatchmaking } =
    useBattleStore();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    if (connectedRef.current) return;

    const socket = io('/', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance = socket;
    connectedRef.current = true;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Battle events
    socket.on('battle:state_changed', ({ battleId, state, startTime, endTime }) => {
      updateState(state, startTime, endTime);
      if (state === 'ACTIVE') {
        toast.success('⚔️ Battle started!', { duration: 3000 });
      }
    });

    socket.on('battle:participant_updated', ({ participant }) => {
      updateParticipant(participant);
    });

    socket.on('battle:countdown', ({ secondsRemaining }) => {
      setSecondsRemaining(secondsRemaining);
    });

    socket.on('battle:timer_sync', ({ secondsRemaining }) => {
      setSecondsRemaining(secondsRemaining);
    });

    socket.on('battle:completed', ({ winnerId, isDraw }) => {
      updateState('COMPLETED');
    });

    // Matchmaking
    socket.on('matchmaking:found', ({ battleId, inviteCode }) => {
      setMatchmaking(false);
      toast.success('🎯 Opponent found!');
      window.location.href = `/battle/${battleId}/waiting`;
    });

    socket.on('matchmaking:cancelled', ({ reason }) => {
      setMatchmaking(false);
      toast.error(reason);
    });

    // Opponent events
    socket.on('opponent:disconnected', ({ gracePeriodSeconds }) => {
      toast(`Opponent disconnected — ${gracePeriodSeconds}s grace period`, { icon: '⚠️', duration: 5000 });
    });

    socket.on('opponent:reconnected', () => {
      toast.success('Opponent reconnected!');
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
      connectedRef.current = false;
    };
  }, [isAuthenticated, accessToken]);

  const emit = useCallback(<T>(event: string, data: T) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
    }
  }, []);

  const emitWithAck = useCallback(
    <T, R>(event: string, data: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        if (!socketInstance?.connected) {
          reject(new Error('Socket not connected'));
          return;
        }
        socketInstance.emit(event, data, (err: string | null, result: R) => {
          if (err) reject(new Error(err));
          else resolve(result);
        });
      });
    },
    [],
  );

  return { emit, emitWithAck, socket: socketInstance };
}
