'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/adapters/http';
import { LABELS } from '@/content/labels';
import { MATCH_STATUS_LABELS, MATCH_STATUS_COLORS } from '@/content/match';
import { CalendarDays, MapPin, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RefereeDashboard() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyMatches = async () => {
      try {
        const { data } = await api.get('/matches/referee/me');
        setMatches(data.data);
      } catch (err) {
        console.error('Error fetching referee matches', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyMatches();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4 bg-bg-primary min-h-screen">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="main-container px-6 py-12 pb-32 bg-bg-primary mesh-bg min-h-screen space-y-8">
      <div className="flex items-end justify-between border-b-8 border-black pb-4">
        <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none italic">Mis Partidos</h1>
        <div className="h-4 w-24 bg-accent-primary" />
      </div>

      {matches.length === 0 ? (
        <div className="py-20 text-center border-4 border-dashed border-black/10">
          <Shield size={48} className="mx-auto mb-4 text-border-subtle" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No tienes partidos asignados actualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match, i) => {
            const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div 
                  onClick={() => router.push(`/matches/${match.id}`)}
                  className="bg-bg-card border-2 border-black overflow-hidden cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-y-1"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center px-4 py-2 bg-black text-white border-b-2 border-accent-primary">
                    <span className="text-[9px] font-black text-accent-primary uppercase tracking-widest truncate">
                      {match.tournament.name}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black ${MATCH_STATUS_COLORS[match.status] ?? ''}`}>
                      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-current live-pulse" />}
                      {MATCH_STATUS_LABELS[match.status] ?? match.status}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 flex flex-col items-end text-right">
                        <span className="text-[10px] uppercase font-black text-text-secondary mb-1 opacity-40">Local</span>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-black text-text-primary leading-tight break-words uppercase italic">{match.homeTeam.nameShort ?? match.homeTeam.name}</span>
                          <div className="h-8 w-8 bg-bg-secondary border border-border-subtle flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                            {match.homeTeam.logo ? (
                              <img src={match.homeTeam.logo} alt="" className="h-full w-full object-cover" />
                            ) : match.homeTeam.name[0]}
                          </div>
                        </div>
                      </div>

                      <div className="bg-black text-white px-4 py-2 flex items-center gap-2 border-b-4 border-accent-primary shrink-0">
                        <span className="text-xl font-black italic">{match.homeGoals ?? '-'}</span>
                        <span className="text-xs opacity-30">:</span>
                        <span className="text-xl font-black italic">{match.awayGoals ?? '-'}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-start text-left">
                        <span className="text-[10px] uppercase font-black text-text-secondary mb-1 opacity-40">Visita</span>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-bg-secondary border border-border-subtle flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                            {match.awayTeam.logo ? (
                              <img src={match.awayTeam.logo} alt="" className="h-full w-full object-cover" />
                            ) : match.awayTeam.name[0]}
                          </div>
                          <span className="text-sm font-black text-text-primary leading-tight break-words uppercase italic">{match.awayTeam.nameShort ?? match.awayTeam.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-4 pt-3 border-t-2 border-border-subtle flex items-center justify-between text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <CalendarDays size={10} />
                          {new Date(match.matchDate).toLocaleDateString('es-AR', {
                            day: 'numeric', month: 'short'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          {match.matchTime || '--:--'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 truncate max-w-[120px]">
                        <MapPin size={10} className="text-accent-primary" />
                        {match.stadium || match.homeTeam?.stadium || 'Sede a definir'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
