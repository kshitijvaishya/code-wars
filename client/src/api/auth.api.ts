import { apiClient, extractData } from './client';
import type { UserProfile } from '../types';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/register', data).then(extractData),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', data).then(extractData),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { accessToken: string; refreshToken: string } }>('/auth/refresh', { refreshToken }).then(extractData),

  me: () =>
    apiClient.get<{ data: { user: UserProfile } }>('/auth/me').then((r) => r.data.data.user),
};
