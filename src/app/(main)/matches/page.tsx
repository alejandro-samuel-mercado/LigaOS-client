'use client';

import { api } from '@/adapters/http';
import { useLocation } from '@/context/LocationContext';
import { usePersistentData } from '@/hooks/usePersistentData';
import { CalendarDays, ChevronLeft, MapPin, Search, Shield, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Match {
    id: string;
    matchDate: string;
    matchTime: string | null;
    status: 'UPCOMING' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'ANNULLED';
    homeGoals: number;
    awayGoals: number;
    homeTeam: { id: string; name: string; logo: string | null; stadium: string | null };
    awayTeam: { id: string; name: string; logo: string | null };
    tournament: { id: string; name: string };
    groupName: string | null;
    stadium: string | null;
    hasExtraTime?: boolean;
    hasPenalties?: boolean;
    homePenalties?: number | null;
    awayPenalties?: number | null;
}

export default function MatchesPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'recent'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const { location, isLoaded } = useLocation();

    const { data: upcoming, loading: loadingUp } = usePersistentData<Match[]>(
        `all_upcoming_matches_v3_${location.state || 'all'}`,
        async () => {
            if (!isLoaded) return [];
            const stateParam = location.state ? `&state=${encodeURIComponent(location.state)}` : '';
            const res = await api.get(`/matches/upcoming?t=${Date.now()}${stateParam}`);
            return res.data.data;
        },
        [location.state, isLoaded]
    );

    const { data: recent, loading: loadingRecent } = usePersistentData<Match[]>(
        `all_recent_matches_v3_${location.state || 'all'}`,
        async () => {
            if (!isLoaded) return [];
            const stateParam = location.state ? `&state=${encodeURIComponent(location.state)}` : '';
            const res = await api.get(`/matches/recent?t=${Date.now()}${stateParam}`);
            return res.data.data;
        },
        [location.state, isLoaded]
    );

    const matches = activeTab === 'upcoming' ? upcoming || [] : recent || [];
    const loading = activeTab === 'upcoming' ? loadingUp : loadingRecent;

    const filteredMatches = matches.filter(m =>
        m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    console.log("ll: " + filteredMatches)

    return (
        <div className="min-h-screen pb-32 bg-bg-primary mesh-bg">
            <div className="relative h-48 bg-black border-b-8 border-accent-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                <div className="main-container relative h-full flex flex-col justify-end p-8">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-6 top-6 h-10 w-10 flex items-center justify-center bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black transition-all z-20"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Calendario de <span className="text-accent-primary">Partidos</span>
                    </h1>
                </div>
            </div>

            <div className="main-container px-6 -mt-8 relative z-10 space-y-8">
                {/* Search & Tabs */}
                <div className="bg-bg-card border-2 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black transition-all ${activeTab === 'upcoming' ? 'bg-black text-white shadow-[4px_4px_0px_0px_var(--accent-primary)] -translate-y-1' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary'
                                }`}
                        >
                            Próximos
                        </button>
                        <button
                            onClick={() => setActiveTab('recent')}
                            className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black transition-all ${activeTab === 'recent' ? 'bg-black text-white shadow-[4px_4px_0px_0px_var(--accent-primary)] -translate-y-1' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary'
                                }`}
                        >
                            Recientes
                        </button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="BUSCAR EQUIPO O TORNEO..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-secondary border-2 border-black py-2 pl-10 pr-4 text-sm font-black uppercase outline-none focus:border-accent-primary transition-all"
                        />
                    </div>
                </div>

                {/* Match List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-48 bg-bg-card border-2 border-black animate-pulse" />
                        ))
                    ) : filteredMatches.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-4 border-dashed border-black/10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">
                                No se encontraron partidos
                            </p>
                        </div>
                    ) : (
                        filteredMatches.map((m) => (
                            <div key={m.id} className="bg-bg-card border-2 border-black overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col">
                                <div className="flex items-center justify-between px-4 py-2 bg-black text-white border-b-2 border-accent-primary">
                                    <div className="flex items-center gap-2">
                                        <Trophy size={12} className="text-accent-primary" />
                                        <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[150px]">
                                            {m.tournament.name}
                                        </span>
                                        {m.groupName && (
                                            <span className="px-1.5 py-0.5 bg-accent-primary text-black text-[7px] font-black border border-black transform -skew-x-12 ml-2">
                                                GRUPO {m.groupName}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 text-[7px] font-black uppercase ${
                                        m.status === 'LIVE' ? 'bg-red-600 animate-pulse' : 
                                        m.status === 'POSTPONED' ? 'bg-accent-gold text-black' :
                                        m.status === 'ANNULLED' ? 'bg-red-900 text-white' :
                                        'bg-white/10'
                                        }`}>
                                        {m.status}
                                    </span>
                                </div>

                                <Link href={`/matches/${m.id}`} className="p-5 flex flex-col h-full justify-between gap-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 flex flex-col items-end text-right">
                                            <div className="h-10 w-10 border border-border-subtle p-1 mb-2">
                                                {m.homeTeam.logo ? <img src={m.homeTeam.logo} alt="" className="h-full w-full object-contain" /> : <Shield size={16} className="opacity-10 mx-auto" />}
                                            </div>
                                            <span className="text-xs font-black text-text-primary leading-tight uppercase italic">{m.homeTeam.name}</span>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            {m.status === 'UPCOMING' ? (
                                                <div className="text-center px-4">
                                                    <span className="text-xl font-black italic">{m.matchTime || '--:--'}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 mx-2">
                                                    <div className="bg-black text-white px-4 py-2 flex items-center gap-2 border-b-4 border-accent-primary">
                                                        {m.hasPenalties && <span className="text-[10px] font-black text-accent-primary">({m.homePenalties ?? 0})</span>}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl font-black italic tabular-nums">{m.homeGoals}</span>
                                                            <span className="text-xs opacity-30">:</span>
                                                            <span className="text-xl font-black italic tabular-nums">{m.awayGoals}</span>
                                                        </div>
                                                        {m.hasPenalties && <span className="text-[10px] font-black text-accent-primary">({m.awayPenalties ?? 0})</span>}
                                                    </div>
                                                    {m.hasExtraTime && (
                                                        <span className="text-[7px] font-black uppercase text-accent-primary/50 italic tracking-widest">T. Extra</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col items-start text-left">
                                            <div className="h-10 w-10 border border-border-subtle p-1 mb-2">
                                                {m.awayTeam.logo ? <img src={m.awayTeam.logo} alt="" className="h-full w-full object-contain" /> : <Shield size={16} className="opacity-10 mx-auto" />}
                                            </div>
                                            <span className="text-xs font-black text-text-primary leading-tight uppercase italic">{m.awayTeam.name}</span>
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-3 border-t-2 border-border-subtle flex items-center justify-between text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <CalendarDays size={10} />
                                                {new Date(m.matchDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 max-w-[120px] truncate">
                                            <MapPin size={10} className="text-accent-primary" />
                                            {m.stadium || m.homeTeam?.stadium || 'Sede a definir'}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
