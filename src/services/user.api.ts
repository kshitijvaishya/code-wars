import { apiClient, extractData } from './client';
import type { UserProfile, RatingHistoryEntry, PaginatedResult } from '../types';

export const userApi = {
  get: (id: string) =>
    apiClient.get<{ data: UserProfile }>(`/users/${id}`).then(extractData),

  updateProfile: (data: { bio?: string; avatarUrl?: string }) =>
    apiClient.put<{ data: UserProfile }>('/users/me', data).then(extractData),

  getRatingHistory: (id: string) =>
    apiClient.get<{ data: RatingHistoryEntry[] }>(`/users/${id}/rating-history`).then(extractData),

  getLeaderboard: (params?: { page?: number; pageSize?: number; period?: string }) =>
    apiClient.get<{ data: PaginatedResult<UserProfile> }>('/users/leaderboard', { params }).then(extractData),
};
