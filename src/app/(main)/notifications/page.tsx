'use client';

import { api } from '@/adapters/http';
import { usePersistentData } from '@/hooks/usePersistentData';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { Bell, Check, ChevronLeft, Calendar, Trophy, MessageCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { success, error: showError } = useAlert();

    const { data: rawData, loading, refresh } = usePersistentData<any>(
        'user_notifications',
        async () => {
            const { data } = await api.get('/notifications?pageSize=50');
            return data;
        },
        [user?.id]
    );

    const notifications = rawData?.data || [];

    const handleMarkAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            success('Todas las notificaciones marcadas como leídas');
            refresh();
        } catch (err: any) {
            showError('Error al actualizar las notificaciones');
        }
    };

    const handleRead = async (id: string, isRead: boolean, link?: string | null) => {
        if (!isRead) {
            try {
                await api.patch(`/notifications/${id}/read`);
                refresh();
            } catch (err) { }
        }
        if (link) {
            router.push(link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'MATCH_REMINDER': 
            case 'MATCH_STARTED':
            case 'MATCH_FINISHED': return <Calendar size={18} />;
            case 'GOAL_SCORED': 
            case 'TOURNAMENT_ENROLLMENT': return <Trophy size={18} />;
            case 'NEW_PUBLICATION': return <MessageCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    return (
        <div className="min-h-screen pb-32 bg-bg-primary mesh-bg">
            <div className="relative h-40 bg-black border-b-8 border-accent-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

                <button
                    onClick={() => router.back()}
                    className="absolute left-6 top-6 h-12 w-12 flex items-center justify-center bg-white/10 text-white border-2 border-white/20 hover:bg-white hover:text-black transition-all z-20"
                >
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>

                <div className="relative z-10 flex flex-col items-center justify-center h-full pt-6">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Bell size={28} className="text-accent-primary" /> Notificaciones
                    </h1>
                </div>
            </div>

            <div className="main-container px-6 -mt-6 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">
                        Tu centro de avisos
                    </p>
                    {notifications.some((n: any) => !n.isRead) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-bg-card border-2 border-black text-[10px] font-black uppercase text-text-secondary hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <Check size={14} /> Marcar todo como leído
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-text-secondary">
                        <div className="h-6 w-6 border-2 border-accent-primary border-t-transparent animate-spin mx-auto mb-2" />
                        <span className="text-[10px] uppercase tracking-widest font-black">Cargando...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-bg-card border-2 border-dashed border-border-subtle py-20 text-center flex flex-col items-center justify-center">
                        <Bell size={48} className="text-border-subtle mb-4" />
                        <p className="text-sm font-black text-text-secondary uppercase tracking-widest">No tienes notificaciones</p>
                        <p className="text-xs text-text-secondary mt-2">Aquí aparecerán todos tus avisos y alertas en vivo.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <AnimatePresence>
                            {notifications.map((notif: any, i: number) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => handleRead(notif.id, notif.isRead, notif.link)}
                                    className={`group cursor-pointer flex items-start gap-4 p-5 border-2 border-black hover:-translate-y-1 transition-all ${
                                        notif.isRead ? 'bg-bg-card opacity-70 grayscale hover:grayscale-0' : 'bg-bg-secondary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <div className={`flex w-12 h-12 shrink-0 items-center justify-center border-2 border-black ${notif.isRead ? 'bg-bg-primary text-text-secondary' : 'bg-accent-primary text-black group-hover:bg-black group-hover:text-white transition-all'}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="font-black text-sm uppercase tracking-tight text-text-primary leading-tight mb-1">
                                                {notif.title}
                                            </h3>
                                            {!notif.isRead && <span className="w-2 h-2 shrink-0 bg-red-600 rounded-full animate-pulse" />}
                                        </div>
                                        <p className="text-xs text-text-secondary line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <span className="block mt-3 text-[9px] font-black uppercase text-accent-primary tracking-widest">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
