import { apiClient, extractData } from './client';
import type { Problem, PaginatedResult } from '../types';

export const problemApi = {
  list: (params?: { difficulty?: string; tags?: string; page?: number; pageSize?: number; search?: string }) =>
    apiClient.get<{ data: PaginatedResult<Problem> }>('/problems', { params }).then(extractData),

  get: (id: string) =>
    apiClient.get<{ data: Problem }>(`/problems/${id}`).then(extractData),

  // Admin
  adminList: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<{ data: PaginatedResult<Problem> }>('/problems/admin/list', { params }).then(extractData),

  adminGet: (id: string) =>
    apiClient.get<{ data: Problem }>(`/problems/admin/${id}`).then(extractData),

  create: (data: Partial<Problem>) =>
    apiClient.post<{ data: Problem }>('/problems', data).then(extractData),

  update: (id: string, data: Partial<Problem>) =>
    apiClient.put<{ data: Problem }>(`/problems/${id}`, data).then(extractData),

  delete: (id: string) =>
    apiClient.delete(`/problems/${id}`),
};
