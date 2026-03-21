/**
 * Authentication context provider.
 * Stores access token in memory (NOT localStorage) for security.
 * Handles login, register, logout, and auto-refresh on mount.
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { api, setAccessToken } from '@/adapters/http';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: string;
  status: string;
  image: string | null;
  publicFields: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  lastName: string;
  dni?: string;
  phone?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.data.accessToken);
      const { data: meData } = await api.get('/auth/me');
      setUser(meData.data);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isAuthenticating = useRef(false);

  const login = useCallback(async (email: string, password: string) => {
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    } finally {
      isAuthenticating.current = false;
    }
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;
    try {
      const { data } = await api.post('/auth/register', registerData);
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    } finally {
      isAuthenticating.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
