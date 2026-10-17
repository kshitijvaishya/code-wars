import { apiClient, extractData } from './client';
import type { Battle, PaginatedResult } from '../types';

export const battleApi = {
  create: (data: { difficulty: string; scoringMode: string; durationSeconds?: number }) =>
    apiClient.post<{ data: { battleId: string; inviteCode: string; inviteLink: string; state: string } }>('/battles', data).then(extractData),

  get: (id: string) =>
    apiClient.get<{ data: Battle }>(`/battles/${id}`).then(extractData),

  getByInviteCode: (code: string) =>
    apiClient.get<{ data: Battle }>(`/battles/join/${code}`).then(extractData),

  getResult: (id: string) =>
    apiClient.get<{ data: Battle }>(`/battles/${id}/result`).then(extractData),

  getHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<{ data: PaginatedResult<Battle> }>('/battles/history', { params }).then(extractData),
};
