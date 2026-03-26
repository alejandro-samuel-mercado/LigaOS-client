'use client';

import { usePersistentData } from '@/hooks/usePersistentData';
import { api } from '@/adapters/http';
import { User, Trophy, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface StatsProps {
  tournamentId: string;
}

export function TournamentStats({ tournamentId }: StatsProps) {
  const { data: stats, loading } = usePersistentData<any>(
    `tournament_stats_${tournamentId}`,
    async () => {
      // In a real app we'd have a specific endpoint, but we can aggregate from matches
      const { data } = await api.get(`/tournaments/${tournamentId}?t=${Date.now()}`);
      
      const scorers = new Map<string, { player: any, team: any, goals: number }>();
      const yellowCards = new Map<string, { player: any, team: any, count: number }>();
      const redCards = new Map<string, { player: any, team: any, count: number }>();

      data.data.matches.forEach((m: any) => {
        if (!m.events) return;
        m.events.forEach((e: any) => {
          if (!e.player) return; // Skip events without a player attached
          
          const team = e.teamSide === 'home' ? m.homeTeam : m.awayTeam;
          
          if (e.type === 'GOAL') {
            const current = scorers.get(e.player.id) || { player: e.player, team, goals: 0 };
            current.goals += 1;
            scorers.set(e.player.id, current);
          } else if (e.type === 'YELLOW_CARD') {
            const current = yellowCards.get(e.player.id) || { player: e.player, team, count: 0 };
            current.count += 1;
            yellowCards.set(e.player.id, current);
          } else if (e.type === 'RED_CARD') {
            const current = redCards.get(e.player.id) || { player: e.player, team, count: 0 };
            current.count += 1;
            redCards.set(e.player.id, current);
          }
        });
      });

      return {
        scorers: Array.from(scorers.values()).sort((a, b) => b.goals - a.goals).slice(0, 50),
        yellowCards: Array.from(yellowCards.values()).sort((a, b) => b.count - a.count).slice(0, 50),
        redCards: Array.from(redCards.values()).sort((a, b) => b.count - a.count).slice(0, 50),
      };
    },
    [tournamentId]
  );

  if (loading) return <div className="text-center p-8 text-text-secondary">Cargando estadísticas...</div>;
  if (!stats) return <div className="text-center p-8">No hay estadísticas disponibles</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatColumn title="Goleadores" icon={<Trophy size={16} className="text-accent-gold" />} data={stats.scorers} type="goals" />
      <StatColumn title="Tarjetas Amarillas" icon={<AlertTriangle size={16} className="text-accent-gold" />} data={stats.yellowCards} type="yellowCards" />
      <StatColumn title="Tarjetas Rojas" icon={<AlertTriangle size={16} className="text-red-500" />} data={stats.redCards} type="redCards" />
    </div>
  );
}

function StatColumn({ title, icon, data, type }: any) {
  return (
    <div className="bg-bg-card border-2 border-black">
      <div className="bg-black text-white p-4 flex items-center gap-2 border-b-4 border-accent-primary">
        {icon}
        <h3 className="font-black uppercase tracking-widest text-sm">{title}</h3>
      </div>
      <div className="p-4 flex flex-col gap-2">
        {data.length === 0 ? (
          <div className="text-center p-4 text-text-secondary text-[10px] uppercase font-black tracking-widest">
            Sin registros
          </div>
        ) : (
          data.map((item: any, idx: number) => (
            <div key={item.player.id} className="flex items-center justify-between p-2 border-l-4 border-black bg-bg-secondary hover:border-accent-primary transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-text-secondary w-4 text-right">#{idx + 1}</span>
                <div className="w-8 h-8 rounded-full border border-black overflow-hidden bg-white shrink-0">
                   {item.player.image ? <img src={item.player.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black"><User size={14} /></div>}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase truncate max-w-[120px]">{item.player.name} {item.player.lastName}</span>
                  <span className="text-[9px] text-text-secondary font-black uppercase truncate">{item.team.name}</span>
                </div>
              </div>
              <div className="text-xl font-black italic">{type === 'goals' ? item.goals : item.count}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
