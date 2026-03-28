'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/adapters/http';
import { Shield, Loader2, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { usePersistentData } from '@/hooks/usePersistentData';

export default function MyTeamPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const { data: teamsRaw, loading: teamsLoading } = usePersistentData<any[]>(
        'my_teams_list',
        async () => {
            if (!isAuthenticated) return [];
            const { data } = await api.get('/teams/my');
            return data.data;
        },
        [isAuthenticated]
    );

    const teams = teamsRaw || [];

    const [filterCategory, setFilterCategory] = useState('');
    const [filterDivision, setFilterDivision] = useState('');

    const uniqueCategories = Array.from(new Set(teams.map((t: any) => t.category).filter(Boolean)));
    const uniqueDivisions = Array.from(new Set(teams.map((t: any) => t.division).filter(Boolean)));

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (!teamsLoading && teams.length === 0) {
            setError('No estás asociado a ningún equipo.');
        } else if (!teamsLoading && teams.length === 1) {
            router.replace(`/teams/${teams[0].id}`);
        }
    }, [authLoading, isAuthenticated, user, router, teams, teamsLoading]);

    const loading = teamsLoading || authLoading;

    if (loading && !error) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center bg-bg-primary">
                <div className="h-6 w-6 border-2 border-accent-primary border-t-transparent animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Buscando tus equipos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center p-6 text-center bg-bg-primary">
                <Shield size={48} className="text-border-subtle mb-4" />
                <h2 className="text-xl font-black text-text-primary uppercase italic tracking-tighter mb-2">Sin Equipos</h2>
                <p className="text-text-secondary text-sm mb-6">{error}</p>
                <Link href="/teams" className="px-8 py-3 bg-accent-primary text-white font-black uppercase text-[10px] tracking-widest border-b-4 border-black hover:bg-black transition-all">
                    Explorar Equipos
                </Link>
            </div>
        );
    }

    return (
        <div className="main-container px-6 py-12 space-y-8 bg-bg-primary mesh-bg min-h-screen">
            <div className="flex items-end justify-between border-b-8 border-black pb-4">
                <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none italic">MIS EQUIPOS</h1>
                <div className="h-4 w-24 bg-accent-primary" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Tienes {teams.length} equipos asociados</p>
                <div className="flex gap-2">
                    <select 
                        value={filterCategory} 
                        onChange={e => setFilterCategory(e.target.value)} 
                        className="bg-bg-secondary border-2 border-black px-4 py-2 text-[10px] font-black uppercase text-text-primary focus:outline-none focus:border-accent-primary"
                    >
                        <option value="">Todas las Categorías</option>
                        {uniqueCategories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                    </select>
                    <select 
                        value={filterDivision} 
                        onChange={e => setFilterDivision(e.target.value)} 
                        className="bg-bg-secondary border-2 border-black px-4 py-2 text-[10px] font-black uppercase text-text-primary focus:outline-none focus:border-accent-primary"
                    >
                        <option value="">Todas las Divisiones</option>
                        {uniqueDivisions.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {teams
                    .filter(team => !filterCategory || team.category === filterCategory)
                    .filter(team => !filterDivision || team.division === filterDivision)
                    .map((team, i) => (
                    <motion.div
                        key={team.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Link
                            href={`/teams/${team.id}`}
                            className="group flex items-center gap-5 bg-bg-card border-2 border-black p-5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-y-1"
                        >
                            <div className="flex h-16 w-16 items-center justify-center bg-black border-2 border-black text-white font-bold shrink-0 overflow-hidden group-hover:-rotate-3 transition-all">
                                {team.logo ? (
                                    <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                                ) : <Shield size={24} className="text-white/20" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-text-primary group-hover:text-accent-primary transition-colors uppercase italic tracking-tight text-lg leading-none">{team.name}</h3>
                                <p className="text-[10px] text-accent-primary uppercase tracking-widest font-black mt-1">
                                    {team.president?.id === user?.id ? 'Presidente' : 
                                     team.coach?.id === user?.id ? 'DT' : 
                                     team.players?.[0]?.teamRole || 'Jugador'}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center bg-black text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all">
                                <ArrowRight size={18} />
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PRESIDENT') && (
                    <Link
                        href="/management"
                        className="flex items-center justify-center gap-3 border-4 border-dashed border-black/10 p-8 text-text-secondary hover:text-accent-primary hover:border-accent-primary transition-all group"
                    >
                        <Plus size={20} className="group-hover:scale-110 transition-transform" strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Crear Nuevo Equipo</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
