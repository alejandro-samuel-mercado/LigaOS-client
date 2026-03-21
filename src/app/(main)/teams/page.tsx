/**
 * Teams page — lists all active teams in the league.
 * Includes a search bar and a FAB for team creation (admins/presidents).
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Plus, Search } from 'lucide-react';
import { api } from '@/adapters/http';
import { LABELS } from '@/content/labels';
import { useAuth } from '@/context/AuthContext';

interface TeamPreview {
  id: string;
  name: string;
  nameShort: string | null;
  logo: string | null;
  city: string;
  _count: { players: number };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamPreview[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();


  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      try {
        const { data } = await api.get(`/teams?search=${search}&pageSize=50`);
        setTeams(data.data);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(fetchTeams, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="main-container px-6 py-12 min-h-screen space-y-12 bg-bg-primary mesh-bg">
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between border-b-8 border-black pb-4">
            <h1 className="text-7xl font-black text-text-primary tracking-tighter uppercase leading-none italic">EQUIPOS</h1>
            <div className="h-4 w-24 bg-accent-primary" />
        </div>
        
        {/* Search Bar */}
        <div className="relative group bg-bg-card p-2 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-accent-primary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BUSCAR EQUIPO..."
            className="w-full bg-bg-secondary border-none py-6 pl-16 pr-8 text-lg font-black uppercase text-text-primary placeholder:opacity-20 outline-none focus:ring-2 focus:ring-accent-primary transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 w-full bg-bg-card border-2 border-black animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="py-20 text-center border-4 border-dashed border-black/10">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No se encontraron equipos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/teams/${team.id}`}
                className="group flex flex-col bg-bg-card border-2 border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className="h-2 bg-accent-primary" />
                <div className="p-8 flex items-center gap-6">
                    <div className="flex h-24 w-24 items-center justify-center border-4 border-black bg-black text-4xl font-black text-white shadow-lg -rotate-3 group-hover:rotate-0 transition-transform overflow-hidden shrink-0 italic">
                    {team.logo ? (
                        <img src={team.logo} alt={team.name} className="h-full w-full object-cover grayscale hover:grayscale-0 transition-grayscale" />
                    ) : team.name[0]}
                    </div>
                    <div className="space-y-1 min-w-0">
                        <h3 className="text-2xl font-black text-text-primary uppercase italic tracking-tighter leading-none group-hover:text-accent-primary transition-colors">{team.name}</h3>
                        <div className="flex items-center gap-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40">{team.city}</p>
                            <div className="h-1 w-1 bg-accent-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-primary">{team._count.players} JUGADORES</p>
                        </div>
                    </div>
                </div>
                <div className="bg-black py-2 px-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Ver Plantilla completa</span>
                    <div className="h-4 w-4 bg-accent-primary" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
