import type { User } from '../types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
}

export const createAuthSlice = (set: (fn: (s: AuthState) => Partial<AuthState>) => void): AuthState => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('user') ?? 'null'); } catch { return null; }
  })(),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  setTokens(accessToken, refreshToken, user) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set(() => ({ accessToken, refreshToken, user, isAuthenticated: true }));
  },

  clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set(() => ({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }));
  },
});
