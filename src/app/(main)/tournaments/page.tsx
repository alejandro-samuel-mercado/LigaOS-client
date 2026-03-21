'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Trash2, Search, Calendar } from 'lucide-react';
import { api } from '@/adapters/http';
import { LABELS } from '@/content/labels';
import { useAuth } from '@/context/AuthContext';
import { TournamentDashboard } from '@/components/features/tournaments/TournamentDashboard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePersistentData } from '@/hooks/usePersistentData';

interface TournamentPreview {
    id: string;
    name: string;
    status: string;
    dateStart: string;
    city: string | null;
    category: string | null;
    _count: { teams: number; matches: number };
}

const STATUS_BADGES: Record<string, string> = {
    DRAFT: 'bg-gray-500/20 text-gray-400',
    REGISTRATION: 'bg-blue-500/20 text-blue-400',
    IN_PROGRESS: 'bg-green-500/20 text-green-400',
    FINISHED: 'bg-amber-500/20 text-amber-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Borrador',
    REGISTRATION: 'Inscripciones',
    IN_PROGRESS: 'En curso',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado',
};

export default function TournamentsPage() {
    const { data: tournamentsRaw, loading, refresh: fetchTournaments } = usePersistentData<TournamentPreview[]>(
        'tournaments_list',
        async () => {
            const { data } = await api.get('/tournaments');
            return data.data.sort((a: any, b: any) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime());
        }
    );
    const tournaments = tournamentsRaw || [];

    const [viewTab, setViewTab] = useState<'active' | 'history'>('active');
    const [selectedActiveId, setSelectedActiveId] = useState<string | null>(null);

    // Filters for History
    const [historyDate, setHistoryDate] = useState('');

    // Dialog state
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const { user } = useAuth();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    // Set default selected tournament when data arrives
    if (!selectedActiveId && tournaments && tournaments.length > 0) {
        const activeOnes = tournaments.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'REGISTRATION');
        if (activeOnes.length > 0) {
            setSelectedActiveId(activeOnes[0].id);
        }
    }

    const handleDelete = async (id: string, name: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Torneo',
            message: `¿Estás seguro de eliminar el torneo "${name}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/tournaments/${id}`);
                    fetchTournaments();
                } catch (err: any) {
                    setConfirmConfig(prev => ({
                        ...prev,
                        isOpen: true,
                        title: 'Error',
                        message: err.response?.data?.message || 'Error al eliminar torneo',
                        onConfirm: () => { },
                    }));
                }
            },
        });
    };

    const activeTournaments = tournaments.filter(t => {
        return t.status !== 'FINISHED' && t.status !== 'CANCELLED';
    });
    const historyTournaments = tournaments.filter(t => {
        const isPast = t.status === 'FINISHED' || t.status === 'CANCELLED';
        const matchesDate = historyDate ? t.dateStart.startsWith(historyDate) : true;
        return isPast && matchesDate;
    });

    return (
        <div className="main-container px-6 py-12 pb-40 min-h-screen space-y-12 bg-bg-primary mesh-bg">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2 border-b-8 border-black pb-4">
                    <div className="flex items-end justify-between">
                        <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none italic">
                            {viewTab === 'active' ? 'TORNEOS' : 'HISTORIAL'}
                        </h1>
                        <button 
                            onClick={() => setViewTab(prev => prev === 'active' ? 'history' : 'active')}
                            className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:-translate-y-1 transition-transform border border-accent-primary shadow-[4px_4px_0px_0px_var(--accent-primary)] whitespace-nowrap"
                        >
                            {viewTab === 'active' ? 'Ver Historial' : 'Ver Torneos'}
                        </button>
                    </div>
                </div>
            </div>

            {viewTab === 'active' && (
                <div className="space-y-10">
                    {!isAdmin && activeTournaments.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
                            {activeTournaments.map(at => (
                                <button
                                    key={at.id}
                                    onClick={() => setSelectedActiveId(at.id)}
                                    className={`px-6 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all ${selectedActiveId === at.id
                                        ? 'bg-accent-primary text-black'
                                        : 'bg-white text-black/40 hover:bg-black/5'
                                        }`}
                                >
                                    {at.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest italic animate-pulse">Cargando torneos...</div>
                    ) : viewTab === 'active' && !isAdmin && selectedActiveId ? (
                        <TournamentDashboard tournamentId={selectedActiveId} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {activeTournaments.length === 0 ? (
                                <div className="col-span-full py-20 text-center border-4 border-dashed border-black/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No hay torneos activos en este momento</p>
                                </div>
                            ) : (
                                activeTournaments.map((tournament, i) => (
                                    <motion.div
                                        key={tournament.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={`/tournaments/${tournament.id}`}
                                            className="group block bg-bg-card border-2 border-black p-8 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 h-24 w-24 bg-accent-primary/5 -rotate-45 translate-x-12 -translate-y-12 group-hover:bg-accent-primary/10 transition-colors" />

                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary">{STATUS_LABELS[tournament.status]}</p>
                                                    <h3 className="text-3xl font-black text-text-primary italic tracking-tighter uppercase leading-none">{tournament.name}</h3>
                                                    <div className="flex items-center gap-4 pt-2">
                                                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">{tournament.city}</span>
                                                        <div className="h-1 w-1 bg-accent-primary" />
                                                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">{tournament.category}</span>
                                                    </div>
                                                </div>
                                                <div className="h-16 w-16 bg-black flex items-center justify-center text-accent-primary border-b-4 border-accent-primary group-hover:scale-110 transition-transform">
                                                    <Trophy size={32} strokeWidth={3} />
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t-2 border-black/5 flex items-center justify-between">
                                                <div className="flex gap-6">
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black uppercase text-text-secondary opacity-40">Equipos</p>
                                                        <p className="text-xl font-black italic">{tournament._count.teams}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black uppercase text-text-secondary opacity-40">Partidos</p>
                                                        <p className="text-xl font-black italic">{tournament._count.matches}</p>
                                                    </div>
                                                </div>
                                                {isAdmin && (tournament.status === 'DRAFT' || tournament.status === 'REGISTRATION') && (
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(tournament.id, tournament.name); }}
                                                        className="bg-red-600 text-white p-3 border-2 border-black hover:bg-black transition-colors"
                                                    >
                                                        <Trash2 size={18} strokeWidth={3} />
                                                    </button>
                                                )}
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {viewTab === 'history' && (
                <div className="space-y-10">
                    <div className="bg-black p-8 border-b-8 border-accent-primary">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-3 italic">Filtrar por fecha</label>
                        <div className="relative max-w-xs">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
                            <input
                                type="date"
                                value={historyDate}
                                onChange={e => setHistoryDate(e.target.value)}
                                className="w-full bg-white/10 border-2 border-white/20 px-12 py-4 text-xs font-black text-white outline-none focus:border-accent-primary [color-scheme:dark] uppercase tracking-widest"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {historyTournaments.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-4 border-dashed border-black/10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No se encontraron torneos pasados</p>
                            </div>
                        ) : (
                            historyTournaments.map((t) => (
                                <Link key={t.id} href={`/tournaments/${t.id}`} className="group p-8 bg-bg-card border-2 border-black hover:bg-bg-secondary transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <Trophy size={24} className="text-text-secondary opacity-20" />
                                            <span className="text-[10px] font-black uppercase bg-black text-white px-3 py-1">FINALIZADO</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-2xl font-black text-text-primary italic tracking-tighter uppercase leading-tight">{t.name}</h4>
                                            <p className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em]">{new Date(t.dateStart).getFullYear()} • {t.city}</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-4 border-t-2 border-black/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Ver Detalles</span>
                                        <ChevronRight size={20} strokeWidth={3} />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.title === 'Eliminar Torneo' ? 'danger' : 'default'}
            />
        </div>
    );
}
