'use client';

import { api } from '@/adapters/http';
import { useLocation } from '@/context/LocationContext';
import { motion } from 'framer-motion';
import { Award, ChevronLeft, Medal, Shield, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WinnersPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { location, isLoaded } = useLocation();

  useEffect(() => {
    if (!isLoaded) return;
    async function fetchStats() {
      try {
        const stateQuery = location.state ? `?state=${encodeURIComponent(location.state)}` : '';
        const res = await api.get(`/tournaments/winners/stats${stateQuery}`);
        setData(res.data.data);
      } catch (err) {
      
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [location.state, isLoaded]);

  if (loading) return <div className="p-8 text-center text-text-secondary">Cargando rankings...</div>;

  return (
    <div className="min-h-screen pb-32 bg-bg-primary mesh-bg">
      <div className="bg-black text-white border-b-8 border-accent-primary p-6 flex items-center gap-4 sticky top-0 z-20">
        <button
          onClick={() => router.back()}
          className="h-12 w-12 flex items-center justify-center bg-white/10 border-2 border-white/20 hover:bg-white hover:text-black transition-all"
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
          <Trophy size={20} className="text-accent-gold" />
          Rankings
        </h1>
      </div>

      <div className="main-container px-6 py-10 space-y-10">
        {/* Top Winningest Teams */}
        <section>
          <div className="flex items-end justify-between border-b-4 border-black pb-4 mb-6">
            <div className="flex items-center gap-2 text-accent-primary">
              <Award size={20} />
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Equipos más ganadores</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            {data?.topWinningest?.map((item: any, idx: number) => (
              <motion.div
                key={item.team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between bg-bg-card border-2 border-black p-5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 flex items-center justify-center font-black text-sm ${
                    idx === 0 ? 'bg-accent-gold text-black border-b-4 border-black' : 
                    idx === 1 ? 'bg-gray-300 text-black border-b-4 border-black' : 
                    idx === 2 ? 'bg-amber-700 text-white border-b-4 border-black' : 'bg-bg-secondary text-text-secondary border-2 border-border-subtle'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="h-12 w-12 bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                    {item.team.logo ? <img src={item.team.logo} className="h-full w-full object-cover" /> : <Shield size={20} className="text-white/20" />}
                  </div>
                  <div>
                    <p className="font-black text-text-primary uppercase italic">{item.team.name}</p>
                    <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black">Campeonatos</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-accent-primary italic">
                  {item.count}
                </div>
              </motion.div>
            ))}
            {(!data?.topWinningest || data.topWinningest.length === 0) && (
              <div className="py-20 text-center border-4 border-dashed border-black/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Aún no hay campeones registrados.</p>
              </div>
            )}
          </div>
        </section>

        {/* Latest Winners */}
        <section>
          <div className="flex items-end justify-between border-b-4 border-black pb-4 mb-6">
            <div className="flex items-center gap-2 text-accent-gold">
              <Medal size={20} />
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Últimos campeones</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {data?.latestWinners?.map((item: any, idx: number) => (
              <motion.div
                key={item.tournamentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="bg-bg-card border-2 border-black border-l-8 border-l-accent-gold p-5 flex items-center gap-4"
              >
                <div className="flex-1">
                  <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{item.tournamentName}</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                      {item.winner.logo ? <img src={item.winner.logo} className="h-full w-full object-cover" /> : <Shield size={16} className="text-accent-primary" />}
                    </div>
                    <span className="font-black text-text-primary uppercase italic">{item.winner.name}</span>
                  </div>
                </div>
                <div className="text-sm text-text-secondary font-black uppercase tracking-widest">
                  {new Date(item.dateEnd).getFullYear()}
                </div>
              </motion.div>
            ))}
            {(!data?.latestWinners || data.latestWinners.length === 0) && (
              <div className="py-20 text-center border-4 border-dashed border-black/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No hay torneos finalizados recientemente.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
