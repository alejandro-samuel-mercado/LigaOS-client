'use client';

import { api } from '@/adapters/http';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function NotificationBell() {
    const { user } = useAuth();
    const { subscribe } = useSocket();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/notifications/unread-count');
            setUnreadCount(data.data.count);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const unsubs = [
            subscribe('notification:new', () => {
                setUnreadCount(prev => prev + 1);
            })
        ];
        return () => unsubs.forEach(unsub => unsub());
    }, [user, subscribe]);

    if (!user) return null;

    return (
        <Link
            href="/notifications"
            className="absolute top-6 right-20 z-50 h-12 w-12 rounded-full bg-accent-primary backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
        >
            <div className="relative">
                <Bell size={20} className="text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-black shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </div>
        </Link>
    );
}
