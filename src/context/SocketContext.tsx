'use client';

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '@/adapters/http';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

type SocketEventHandler = (...args: any[]) => void;

interface SocketContextType {
  subscribe: (event: string, handler: SocketEventHandler) => () => void;
  emit: (event: string, ...args: any[]) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuth();
  const connectedRef = useRef(false);

  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:4000';

    const token = getAccessToken();

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      auth: token ? { token } : {},
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      connectedRef.current = true;
    });

    socket.on('disconnect', () => {
      connectedRef.current = false;
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
      connectedRef.current = false;
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((event: string, handler: SocketEventHandler) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('match:join', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('match:leave', room);
  }, []);

  return (
    <SocketContext.Provider value={{
      subscribe,
      emit,
      joinRoom,
      leaveRoom,
      isConnected: connectedRef.current,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
