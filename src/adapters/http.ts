import { getErrorMessage } from '@/content/errors';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// In-memory token as primary, localStorage as fallback for reloads/navigation stability
let accessToken: string | null = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    const isAuthRequest = originalRequest && (
      originalRequest.url?.includes('/auth/login') || 
      originalRequest.url?.includes('/auth/register') || 
      originalRequest.url?.includes('/auth/refresh')
    );

    if (error.response?.status === 401 && originalRequest && !isAuthRequest && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        
        // Try refresh with cookies first, then with body if needed (or just body if common for PWA)
        const refreshResponse = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });
        const newToken = refreshResponse.data.data.accessToken;
        
        setAccessToken(newToken);
        
        // If the server returned a new refreshToken in the body, AuthContext will handle it
        // but since this is http.ts, we can't easily call context. We'll hope AuthContext catches the next load.
        // Actually, let's update it here too if it comes in data.data.refreshToken
        if (refreshResponse.data.data.refreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', refreshResponse.data.data.refreshToken);
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        if (typeof window !== 'undefined') localStorage.removeItem('refreshToken');
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle Offline Queue for mutations (POST, PATCH, PUT)
    const isMutation = originalRequest && ['post', 'patch', 'put', 'delete'].includes(originalRequest.method?.toLowerCase() || '');
    const isOfflineError = !error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error';

    if (isOfflineError && isMutation && !isAuthRequest && !(originalRequest as any)._offline) {
      const { offlineQueue } = await import('./offlineQueue');
      offlineQueue.enqueue(
        originalRequest.url || '',
        originalRequest.method || 'post',
        originalRequest.data ? JSON.parse(originalRequest.data) : null,
        originalRequest.headers
      );
      
      // Return a "resolved" fake response to avoid breaking the UI flow
      return Promise.resolve({ data: { success: true, _offline: true } });
    }

    const responseData = error.response?.data as { error?: { code?: string; message?: string } } | undefined;
    const errorCode = responseData?.error?.code ?? 'INTERNAL_ERROR';
    const errorMessage = getErrorMessage(errorCode);

    return Promise.reject({
      code: errorCode,
      message: errorMessage,
      status: error.response?.status,
      details: responseData?.error,
    });
  }
);

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}
