import { apiClient, extractData } from './client';
import type { Submission, RunResult, PaginatedResult } from '../types';

export const submissionApi = {
  run: (data: { problemId: string; languageId: number; sourceCode: string; customInput?: string }) =>
    apiClient.post<{ data: RunResult[] }>('/submissions/run', data).then(extractData),

  submit: (data: { problemId: string; battleId?: string; languageId: number; sourceCode: string }) =>
    apiClient.post<{ data: { submissionId: string } }>('/submissions', data).then(extractData),

  get: (id: string) =>
    apiClient.get<{ data: Submission }>(`/submissions/${id}`).then(extractData),

  list: (params?: { problemId?: string; battleId?: string; page?: number; pageSize?: number }) =>
    apiClient.get<{ data: PaginatedResult<Submission> }>('/submissions', { params }).then(extractData),

  getLanguages: () =>
    apiClient.get<{ data: Array<{ id: number; name: string }> }>('/submissions/languages').then(extractData),
};
