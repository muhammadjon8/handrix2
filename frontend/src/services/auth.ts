import type { User } from '../types';
import { api } from './api';

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export const authService = {
  register: (body: { name: string; email: string; phone: string; password: string; role: 'CLIENT' | 'HANDYMAN' }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),
};
