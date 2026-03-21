'use client';

import { useState } from 'react';
import { api } from '@/adapters/http';
import { Trophy, CalendarDays, MapPin, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePersistentData } from '@/hooks/usePersistentData';

interface Props {
    tournamentId: string;
}

export function TournamentDashboard({ tournamentId }: Props) {
    const { data: tournament, loading } = usePersistentData(
        `tournament_dashboard_v3_${tournamentId}`,
        async () => {
            const res = await api.get(`/tournaments/${tournamentId}?t=${Date.now()}`);
            return res.data.data;
        },
        [tournamentId]
    );

    const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'bracket'>('standings');

    if (loading && !tournament) return <div className="p-8 text-center text-text-secondary animate-pulse text-[10px] font-black uppercase tracking-widest">Cargando dashboard...</div>;
    if (!tournament) return <div className="p-8 text-center text-red-500 font-black uppercase">No se pudo cargar el torneo</div>;

    const teamsInfo = tournament.teams.reduce((acc: any, t: any) => {
        acc[t.teamId] = { 
            groupName: t.groupName, 
            stadium: t.team.stadium 
        };
        return acc;
    }, {}) || {};

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 text-[10px] font-black text-text-secondary bg-bg-secondary px-3 py-1.5 border border-border-subtle uppercase tracking-widest">
                    <CalendarDays size={12} />
                    {new Date(tournament.dateStart).toLocaleDateString()}
                </span>
                {tournament.city && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-text-secondary bg-bg-secondary px-3 py-1.5 border border-border-subtle uppercase tracking-widest">
                        <MapPin size={12} />
                        {tournament.city}
                    </span>
                )}
            </div>

            <div className="flex gap-2 border-b-4 border-black pb-2 overflow-x-auto no-scrollbar">
                {['standings', 'matches', 'bracket'].map((tab) => (
                    (tab !== 'bracket' || tournament.type === 'ELIMINATION') && (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-2 border-black shrink-0 ${activeTab === tab ? 'bg-black text-white shadow-[4px_4px_0px_0px_var(--accent-primary)] -translate-y-1' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'
                                }`}
                        >
                            {tab === 'standings' ? 'Posiciones' : tab === 'matches' ? 'Partidos' : 'Fase de eliminación'}
                        </button>
                    )
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                >
                    {activeTab === 'standings' && (
                        <div className="bg-bg-card border-2 border-black overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-black text-white text-[10px] uppercase tracking-widest">
                                    <tr>
                                        <th className="px-3 py-2">#</th>
                                        <th className="px-3 py-2">Equipo</th>
                                        <th className="px-3 py-2 text-center">PTS</th>
                                        <th className="px-3 py-2 text-center">PJ</th>
                                        <th className="px-3 py-2 text-center">DF</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {tournament.standings.map((s: any, idx: number) => (
                                        <tr key={s.id} className="hover:bg-bg-secondary transition-colors">
                                            <td className="px-3 py-3 font-black text-text-secondary">{idx + 1}</td>
                                            <td className="px-3 py-3">
                                                <Link href={`/teams/${s.teamId}`} className="flex items-center gap-2 font-black text-text-primary uppercase italic hover:text-accent-primary">
                                                    <div className="w-4 h-4 bg-accent-primary/20 text-accent-primary flex items-center justify-center text-[8px] font-black">
                                                        {s.team.name[0]}
                                                    </div>
                                                    <span className="truncate max-w-[100px]">{s.team.name}</span>
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-center font-black text-text-primary">{s.points}</td>
                                            <td className="px-3 py-3 text-center text-text-secondary">{s.played}</td>
                                            <td className="px-3 py-3 text-center text-text-secondary">{s.goalsFor - s.goalsAgainst}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {tournament.matches.length === 0 ? (
                                <div className="col-span-full py-20 text-center border-4 border-dashed border-black/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No hay partidos programados</p>
                                </div>
                            ) : (
                                tournament.matches.slice(0, 10).map((m: any) => (
                                    <div key={m.id} className="bg-bg-card border-2 border-black overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col">
                                            {(() => {
                                                const groupName = m.groupName || teamsInfo[m.homeTeam?.id]?.groupName;
                                                const stadium = m.stadium || m.homeTeam?.stadium || teamsInfo[m.homeTeam?.id]?.stadium || 'Sede a definir';
                                                return (
                                                    <>
                                                        <div className="flex items-center justify-between px-3 py-1 bg-black text-white border-b-2 border-accent-primary">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[8px] font-black text-accent-primary uppercase tracking-widest">
                                                                    {m.matchDay ? `Jornada ${m.matchDay}` : m.round || 'Partido'}
                                                                </span>
                                                                {groupName && (
                                                                    <span className="px-1 py-0.5 bg-accent-primary text-black text-[7px] font-black border border-black transform -skew-x-12">
                                                                        GRUPO {groupName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Link href={`/matches/${m.id}`} className="p-4 flex flex-col gap-3">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <div className="flex-1 flex flex-col items-end text-right">
                                                                    <span className="text-[10px] uppercase font-black text-text-secondary mb-0.5 opacity-40">Local</span>
                                                                    <span className="text-sm font-black text-text-primary leading-tight truncate w-full uppercase italic">{m.homeTeam?.name}</span>
                                                                </div>
                                                                <div className="bg-black text-white px-3 py-1 flex items-center gap-1.5 shrink-0 border-b-4 border-accent-primary">
                                                                    <span className="text-lg font-black italic">{m.homeGoals}</span>
                                                                    <span className="text-[10px] opacity-30">:</span>
                                                                    <span className="text-lg font-black italic">{m.awayGoals}</span>
                                                                </div>
                                                                <div className="flex-1 flex flex-col items-start text-left">
                                                                    <span className="text-[10px] uppercase font-black text-text-secondary mb-0.5 opacity-40">Visita</span>
                                                                    <span className="text-sm font-black text-text-primary leading-tight truncate w-full uppercase italic">{m.awayTeam?.name}</span>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t-2 border-border-subtle flex items-center justify-between text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">
                                                                <div className="flex items-center gap-2">
                                                                    <CalendarDays size={10} />
                                                                    {new Date(m.matchDate).toLocaleDateString()}
                                                                    <span>•</span>
                                                                    <Clock size={10} />
                                                                    {m.matchTime || '--:--'}
                                                                </div>
                                                                <div className="flex items-center gap-1 max-w-[80px] truncate">
                                                                    <MapPin size={10} className="text-accent-primary" />
                                                                    {stadium}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </>
                                                );
                                            })()}
                                    </div>
                                ))
                            )}
                            <Link href={`/tournaments/${tournamentId}`} className="col-span-full text-center text-xs text-accent-primary font-black py-2 hover:underline transition-colors uppercase tracking-widest">
                                Ver fixture completo →
                            </Link>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
