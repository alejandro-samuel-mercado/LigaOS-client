'use client';

import { api, setAccessToken } from '@/adapters/http';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Cookies from 'js-cookie';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: string;
  status: string;
  image: string | null;
  publicFields: string[];
  state?: string | null;
  country?: string | null;
  coins: number;
  social?: {
    followers: number;
    following: number;
  };
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
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_data');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper to update user and localStorage simultaneously
  const updateUserData = useCallback((userData: AuthUser | null) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      const { data: meData } = await api.get('/auth/me');
      updateUserData(meData.data);
      Cookies.set('ligaos_session', 'true', { expires: 365 });
    } catch (err: any) {
      // Only clear session if it's an explicit 401/403 error (token invalid/expired)
      // If it's a network error (502, 503, connection refused), we keep the local state
      if (err.response?.status === 401 || err.response?.status === 403) {
        updateUserData(null);
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        Cookies.remove('ligaos_session');
      }
    } finally {
      setIsLoading(false);
    }
  }, [updateUserData]);

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
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      updateUserData(data.data.user);
      Cookies.set('ligaos_session', 'true', { expires: 365 });
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
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      updateUserData(data.data.user);
      Cookies.set('ligaos_session', 'true', { expires: 365 });
    } finally {
      isAuthenticating.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      updateUserData(null);
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
      Cookies.remove('ligaos_session');
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
