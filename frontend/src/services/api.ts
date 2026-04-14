import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent token refresh on 401
let refreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (refreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newToken: string = data.accessToken;
      localStorage.setItem('accessToken', newToken);
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      refreshing = false;
    }
  },
);
