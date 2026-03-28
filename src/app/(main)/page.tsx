/**
 * Home page — displays upcoming matches, recent results, and teams grid.
 * Mobile-first layout with horizontal scrolling cards.
 */

'use client';

import { api } from '@/adapters/http';
import { MATCH_STATUS_LABELS } from '@/content/match';
import { useLocation } from '@/context/LocationContext';
import { motion } from 'framer-motion';
import { Clock, MapPin, Search, Shield } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InvitationsPanel } from '@/components/features/invitations/InvitationsPanel';

interface MatchPreview {
    id: string;
    matchDate: string;
    matchTime: string | null;
    status: string;
    homeGoals: number;
    awayGoals: number;
    homeTeam: { id: string; name: string; nameShort: string | null; logo: string | null; stadium?: string | null };
    awayTeam: { id: string; name: string; nameShort: string | null; logo: string | null };
    tournament: { id: string; name: string };
    actualStartTime?: string | null;
    secondHalfStartTime?: string | null;
    updatedAt: string;
    injuryTime1?: number | null;
    injuryTime2?: number | null;
    stadium?: string | null;
    groupName?: string | null;
    hasExtraTime?: boolean;
    hasPenalties?: boolean;
    homePenalties?: number | null;
    awayPenalties?: number | null;
}

interface TeamPreview {
    id: string;
    name: string;
    nameShort: string | null;
    logo: string | null;
}

export default function HomePage() {
    const [live, setLive] = useState<MatchPreview[]>([]);
    const [upcoming, setUpcoming] = useState<MatchPreview[]>([]);
    const [recent, setRecent] = useState<MatchPreview[]>([]);
    const [teams, setTeams] = useState<TeamPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { location, isLoaded } = useLocation();

    useEffect(() => {
        if (!isLoaded) return;
        
        async function fetchData() {
            try {
                setLoading(true);
                const stateParam = location.state ? `state=${encodeURIComponent(location.state)}&` : '';
                const [liveRes, upRes, recentRes, teamsRes] = await Promise.all([
                    api.get(`/matches/live?${stateParam}t=${Date.now()}`).catch(() => ({ data: { data: [] } })),
                    api.get(`/matches/upcoming?${stateParam}t=${Date.now()}`).catch(() => ({ data: { data: [] } })),
                    api.get(`/matches/recent?${stateParam}t=${Date.now()}`).catch(() => ({ data: { data: [] } })),
                    api.get(`/teams?${stateParam}pageSize=12&t=${Date.now()}`).catch(() => ({ data: { data: [] } })),
                ]);
                setLive(liveRes.data.data);
                setUpcoming(upRes.data.data);
                setRecent(recentRes.data.data);
                setTeams(teamsRes.data.data);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [location.state, isLoaded]);

    const filteredLive = live.filter(m =>
        m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUpcoming = upcoming.filter(m =>
        m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRecent = recent.filter(m =>
        m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-32 bg-bg-primary mesh-bg">
            {/* Hero / Banner Section */}
            <div className="relative h-[400px] overflow-hidden bg-black border-b-8 border-accent-secondary">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000')] bg-cover bg-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700 scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                <div className="main-container relative h-full flex flex-col justify-end p-10 pb-16">
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="space-y-2"
                    >
                        <h2 className="text-7xl font-black text-white italic tracking-tighter leading-[0.8] uppercase">
                            EL JUEGO<br /><span className="text-accent-primary">NUNCA PARA</span>
                        </h2>
                        <p className="text-xl font-bold text-white/60 uppercase tracking-[0.2em] mt-4">Gestión de liga profesional</p>
                    </motion.div>
                </div>
            </div>

            <div className="main-container px-6 -mt-20 -top-8 relative z-10 space-y-12">
                {/* Search / Filter Bar */}
                <div className="bg-bg-card p-2 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
                        <input
                            type="text"
                            placeholder="BUSCAR EQUIPOS, TORNEOS O RESULTADOS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-secondary border-2 border-gray-300 py-4 pl-12 pr-4 text-sm font-black uppercase outline-none focus:ring-2 focus:ring-accent-primary transition-all"
                        />
                    </div>
                    <button className="bg-black text-white font-black uppercase px-8 py-4 hover:bg-accent-primary transition-colors active:translate-y-1">
                        Buscar
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-16">
                        {filteredLive.length > 0 && (
                            <section>
                                <div className="flex items-end justify-between border-b-4 border-accent-primary pb-4 mb-8">
                                    <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-red-600 flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse" />
                                        Partidos en Juego
                                    </h3>
                                    <Link href="/matches" className="text-xs font-black uppercase tracking-widest text-accent-primary hover:underline">Ver Todos →</Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-subtle border-2 border-accent-primary shadow-[8px_8px_0px_0px_rgba(220,38,38,0.5)]">
                                    {filteredLive.map((match, i) => (
                                        <MatchCard key={match.id} match={match} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <div className="flex items-end justify-between border-b-4 border-black pb-4 mb-8">
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Próximos Partidos</h3>
                                <Link href="/matches" className="text-xs font-black uppercase tracking-widest text-accent-primary hover:underline">Ver Calendario →</Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-subtle border-2 border-border-subtle">
                                {loading ? (
                                    [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-48 w-full" />)
                                ) : filteredUpcoming.length === 0 ? (
                                    <div className="col-span-full h-40 bg-bg-card flex items-center justify-center font-black uppercase text-text-secondary/20 italic text-2xl">Sin Partidos</div>
                                ) : (
                                    filteredUpcoming.map((match, i) => (
                                        <MatchCard key={match.id} match={match} index={i} />
                                    ))
                                )}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-end justify-between border-b-4 border-black pb-4 mb-8">
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Resultados Recientes</h3>
                                <Link href="/matches" className="text-xs font-black uppercase tracking-widest text-accent-primary hover:underline">Ver Todos →</Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-subtle border-2 border-border-subtle">
                                {loading ? (
                                    [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-48 w-full" />)
                                ) : filteredRecent.length === 0 ? (
                                    <div className="col-span-full h-40 bg-bg-card flex items-center justify-center font-black uppercase text-text-secondary/20 italic text-2xl">Sin Resultados</div>
                                ) : (
                                    filteredRecent.map((match, i) => (
                                        <MatchCard key={match.id} match={match} index={i} />
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-3 space-y-12">
                        <InvitationsPanel />
                        <section className="bg-black p-6 border-b-8 border-accent-primary">
                            <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                                <div className="h-2 w-2 bg-accent-primary animate-pulse" />
                                Equipos Destacados
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {teams.map((team, i) => (
                                    <Link key={team.id} href={`/teams/${team.id}`} className="group relative aspect-square bg-bg-secondary border border-border-subtle overflow-hidden">
                                        {team.logo ? (
                                            <img src={team.logo} alt={team.name} className="h-full w-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-3xl font-black text-white/20">{team.name[0]}</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
                                        <span className="absolute bottom-2 left-2 text-[8px] font-black text-white uppercase tracking-tighter truncate w-[calc(100%-1rem)]">{team.nameShort ?? team.name}</span>
                                    </Link>
                                ))}
                            </div>
                            <Link href="/search?type=teams" className="block text-center mt-8 py-3 border border-white/20 text-[10px] font-black uppercase text-white/60 hover:text-white hover:border-white transition-all">
                                Ver Ranking Completo
                            </Link>
                        </section>

                        <div className="aspect-[3/4] bg-accent-secondary p-8 flex flex-col justify-between border-t-8 border-black">
                            <h5 className="text-white text-4xl font-black italic uppercase leading-none tracking-tighter">Únete a la<br />Comunidad</h5>
                            <button className="bg-black text-white py-4 font-black uppercase text-sm hover:bg-white hover:text-black transition-all">Registrar Equipo</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


function TeamLogo({ team, index }: { team: TeamPreview; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link href={`/teams/${team.id}`} className="flex flex-col items-center gap-3 group">
                <div className="h-20 w-20 border-2 border-border-subtle p-3 bg-bg-card group-hover:border-accent-primary transition-all group-hover:-rotate-3 shadow-lg">
                    {team.logo ? (
                        <img src={team.logo} alt={team.name} className="h-full w-full object-contain grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl font-black text-text-secondary/20 uppercase italic">{team.name[0]}</div>
                    )}
                </div>
                <span className="text-[9px] font-black text-text-primary text-center uppercase tracking-widest truncate w-full group-hover:text-accent-primary transition-colors">
                    {team.nameShort ?? team.name}
                </span>
            </Link>
        </motion.div>
    );
}

function Section({ title, linkHref, linkText, children }: {
    title: string;
    linkHref: string;
    linkText: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-6">
            <div className="flex items-end justify-between border-b-2 border-black/10 pb-2">
                <h2 className="text-xl font-black text-text-primary uppercase italic tracking-tighter">{title}</h2>
                <Link href={linkHref} className="text-[10px] font-black uppercase tracking-widest text-accent-primary hover:bg-black hover:text-white px-3 py-1 transition-all">
                    {linkText}
                </Link>
            </div>
            {children}
        </section>
    );
}

function MatchCard({ match, index }: { match: MatchPreview; index: number }) {
    const [timerDisplay, setTimerDisplay] = useState('00:00');
    const [periodLabel, setPeriodLabel] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            let displayMin = 0;
            let displaySec = 0;
            let label = '';

            if (match.status === 'LIVE') {
                const startTime = match.secondHalfStartTime || match.actualStartTime;
                if (startTime) {
                    const diffMs = Date.now() - new Date(startTime).getTime();
                    const totalSec = Math.floor(diffMs / 1000);
                    const baseMin = match.secondHalfStartTime ? 45 : 0;
                    displayMin = baseMin + Math.floor(totalSec / 60);
                    displaySec = totalSec % 60;
                    label = match.secondHalfStartTime ? '2do Tiempo' : '1er Tiempo';
                    
                    if (displayMin > 45 && !match.secondHalfStartTime) label = '1T + Adición';
                    if (displayMin > 90) label = '2T + Adición';
                    if (match.hasExtraTime && displayMin > 90) label = 'Alargue';
                    if (match.hasPenalties) label = 'Penales';
                }
            } else if (match.status === 'HALFTIME') {
                const startTime = new Date(match.updatedAt).getTime();
                const diffMs = Date.now() - startTime;
                const totalSec = Math.floor(diffMs / 1000);
                displayMin = Math.floor(totalSec / 60);
                displaySec = totalSec % 60;
                label = 'Entretiempo';
            } else if (match.status === 'FINISHED') {
                label = 'Finalizado';
                displayMin = 90 + (match.injuryTime1 || 0) + (match.injuryTime2 || 0);
            } else if (match.status === 'UPCOMING') {
                label = 'Próximamente';
            }

            setTimerDisplay(`${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`);
            setPeriodLabel(label);
        }, 1000);

        return () => clearInterval(interval);
    }, [match]);

    const dateStr = new Date(match.matchDate).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-bg-card border border-border-subtle p-6 hover:border-accent-primary transition-all group relative"
        >
            <div className="absolute top-0 right-0 p-2 flex flex-col items-end gap-1">
                <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest ${
                    match.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                    match.status === 'FINISHED' ? 'bg-black text-white' :
                    match.status === 'POSTPONED' ? 'bg-accent-gold text-black' :
                    match.status === 'ANNULLED' ? 'bg-red-900 text-white' :
                    'bg-bg-secondary text-text-secondary'
                    }`}>
                    {match.status === 'LIVE' ? (periodLabel || 'EN VIVO') : (MATCH_STATUS_LABELS[match.status] ?? match.status)}
                </span>
                {match.status === 'LIVE' && (
                    <span className="bg-black text-accent-primary text-[10px] font-black px-2 py-0.5 border border-accent-primary/50 tabular-nums">
                        {timerDisplay}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between gap-4 mb-6 border-l-4 border-accent-primary pl-3">
                <div className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em]">
                    {match.tournament.name}
                </div>
                {match.groupName && (
                    <span className="px-1.5 py-0.5 bg-accent-primary text-black text-[8px] font-black border border-black transform -skew-x-12">
                        GRUPO {match.groupName}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="h-14 w-14 border-2 border-border-subtle p-2 group-hover:border-accent-primary transition-colors">
                        {match.homeTeam.logo ? (
                            <img src={match.homeTeam.logo} alt="" className="h-full w-full object-contain" />
                        ) : <Shield size={24} className="opacity-10" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-center line-clamp-1">{match.homeTeam.nameShort ?? match.homeTeam.name}</span>
                </div>

                <div className="flex flex-col items-center px-4">
                    {match.status === 'UPCOMING' ? (
                        <div className="text-center">
                            <span className="block text-[10px] font-black text-text-secondary uppercase">{dateStr}</span>
                            <span className="block text-2xl font-black italic">{match.matchTime ?? '--:--'}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-3 bg-black text-white px-5 py-2 italic border-b-4 border-accent-primary">
                                {match.hasPenalties && <span className="text-sm font-black text-accent-primary">({match.homePenalties ?? 0})</span>}
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black tabular-nums">{match.homeGoals}</span>
                                    <span className="text-xl opacity-30">-</span>
                                    <span className="text-3xl font-black tabular-nums">{match.awayGoals}</span>
                                </div>
                                {match.hasPenalties && <span className="text-sm font-black text-accent-primary">({match.awayPenalties ?? 0})</span>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="h-14 w-14 border-2 border-border-subtle p-2 group-hover:border-accent-primary transition-colors">
                        {match.awayTeam.logo ? (
                            <img src={match.awayTeam.logo} alt="" className="h-full w-full object-contain" />
                        ) : <Shield size={24} className="opacity-10" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-center line-clamp-1">{match.awayTeam.nameShort ?? match.awayTeam.name}</span>
                </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border-subtle flex items-center justify-between text-[9px] text-text-secondary font-black uppercase tracking-widest opacity-60">
                <div className="flex items-center gap-1">
                    <MapPin size={10} className="text-accent-primary" />
                    {match.stadium || match.homeTeam?.stadium || 'Sede a definir'}
                </div>
                {match.status === 'UPCOMING' && match.matchTime && (
                    <div className="flex items-center gap-1">
                        <Clock size={10} />
                        {match.matchTime}
                    </div>
                )}
            </div>

            <Link href={`/matches/${match.id}`} className="absolute inset-0 z-10" />
        </motion.div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">
            {text}
        </div>
    );
}
