/**
 * HTTP adapter with authentication handling.
 * 
 * Implements axios interceptors for:
 * - Automatically attaching access token to requests (from memory)
 * - Auto-refreshing expired tokens via httpOnly cookie
 * - Queuing requests during refresh to avoid token race conditions
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/content/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

let accessToken: string | null = null;
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

/** Attaches access token if available */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Response interceptor handles 401 errors by attempting token refresh.
 * If refresh succeeds, retries the original request with the new token.
 * Queues concurrent requests during refresh to avoid race conditions.
 */
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
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        // Don't redirect infinitely if already on login page
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Transform error to include human-readable message
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
}

export function getAccessToken(): string | null {
  return accessToken;
}
