'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notificationsService } from '@/services/api';
import type { Notification } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  hasMore: boolean;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { subscribe } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const initialized = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch {}
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await notificationsService.getNotifications({ page: 1, pageSize: 20 });
      setNotifications(result.data);
      setPage(1);
      setHasMore(result.pagination.page < result.pagination.totalPages);
      await fetchUnreadCount();
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await notificationsService.getNotifications({ page: nextPage, pageSize: 20 });
      setNotifications((prev) => [...prev, ...result.data]);
      setPage(nextPage);
      setHasMore(result.pagination.page < result.pagination.totalPages);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  useEffect(() => {
    if (isAuthenticated && !initialized.current) {
      initialized.current = true;
      refresh();
    }
    if (!isAuthenticated) {
      initialized.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = subscribe('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return unsub;
  }, [isAuthenticated, subscribe]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        loadMore,
        markAsRead,
        markAllAsRead,
        hasMore,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
