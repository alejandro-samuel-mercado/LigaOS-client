'use client';

import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, ChevronLeft, MapPin, User, Trophy, Calendar } from 'lucide-react';
import { api } from '@/adapters/http';
import { useAuth } from '@/context/AuthContext';

import { usePersistentData } from '@/hooks/usePersistentData';
import { FollowUserButton } from '@/components/ui/FollowUserButton';

interface PlayerDetail {
  id: string;
  name: string;
  lastName: string;
  image: string | null;
  role: string;
  birthdate?: string;
  city?: string;
  state?: string;
  phone?: string;
  dni?: string;
  publicFields?: string[];
  playerStatus: 'ACTIVE' | 'INJURED' | 'RESTING' | 'INACTIVE';
  teamMemberships: Array<{
    team: { id: string; name: string; logo: string | null };
    number: number | null;
    position: string | null;
    isActive: boolean;
  }>;
  stats: {
    goals: number;
    fouls: number;
    matchesPlayed: number;
    matchesWon: number;
  };
  playerPrizes: Array<{
    id: string;
    title: string;
    year: number;
    description: string | null;
  }>;
  social: {
    followers: number;
    following: number;
  };
}

export default function PlayerPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params['id'] as string;
  const { user: currentUser } = useAuth();
  
  const { data: player, loading } = usePersistentData<PlayerDetail>(
    `player_detail_${playerId}`,
    async () => {
      const res = await api.get(`/users/${playerId}`);
      return res.data.data;
    },
    [playerId]
  );

  if (loading) return <div className="p-8 text-center text-text-secondary">Cargando perfil...</div>;
  if (!player) return <div className="p-8 text-center text-red-500">Usuario no encontrado</div>;

  const canViewHiddenInfo = () => {
    if (!currentUser) return false;
    return ['SUPER_ADMIN', 'ADMIN', 'REFEREE', 'PRESIDENT', 'COACH'].includes(currentUser.role);
  };

  const renderField = (field: 'phone' | 'dni' | 'birthdate', label: string, value?: string) => {
    if (!value) return null;
    const isPublic = player.publicFields?.includes(field);
    const hasPermission = canViewHiddenInfo();

    if (isPublic || hasPermission) {
      return (
        <div className="flex flex-col gap-1 p-4 bg-bg-secondary border-2 border-border-subtle">
          <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest">{label}</span>
          <span className="text-sm font-black text-text-primary">{value}</span>
        </div>
      );
    }
    return null;
  };

  const getStatusColor = (status: PlayerDetail['playerStatus']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-accent-primary text-white';
      case 'INJURED': return 'bg-red-600 text-white';
      case 'RESTING': return 'bg-accent-gold text-black';
      case 'INACTIVE': return 'bg-black/20 text-text-secondary';
      default: return 'bg-black/20 text-text-secondary';
    }
  };

  const getStatusLabel = (status: PlayerDetail['playerStatus']) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'INJURED': return 'Lesionado';
      case 'RESTING': return 'En Descanso';
      case 'INACTIVE': return 'Inactivo';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-32 mesh-bg">
      {/* Hero Banner */}
      <div className="relative h-56 bg-black border-b-8 border-accent-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <button onClick={() => router.back()} className="absolute top-6 left-6 h-12 w-12 flex items-center justify-center bg-white/10 text-white border-2 border-white/20 hover:bg-white hover:text-black transition-all z-20">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="main-container px-6 -mt-20 relative z-10">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-36 w-36 border-8 border-bg-primary bg-black flex items-center justify-center overflow-hidden shadow-2xl -rotate-3 hover:rotate-0 transition-transform mb-4">
            {player.image ? (
              <img src={player.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <User size={60} className="text-white/20" />
            )}
          </div>
          <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter italic text-center leading-none">{player.name} {player.lastName}</h1>
          
          <div className="flex gap-2 mt-4 items-center">
            <span className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest border-b-4 border-accent-primary">
              {player.role}
            </span>
            <span className={`px-4 py-1.5 ${getStatusColor(player.playerStatus)} text-[10px] font-black uppercase tracking-widest`}>
              {getStatusLabel(player.playerStatus)}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <FollowUserButton userId={player.id} size="md" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-6 gap-3 mb-10">
          <StatCard label="Seguidores" value={player.social?.followers || 0} />
          <StatCard label="Siguiendo" value={player.social?.following || 0} />
          <StatCard label="PJ" value={player.stats.matchesPlayed} />
          <StatCard label="PG" value={player.stats.matchesWon} />
          <StatCard label="Goles" value={player.stats.goals} highlight />
          {(currentUser?.id === player.id || canViewHiddenInfo()) && (
            <StatCard label="Faltas" value={player.stats.fouls} danger />
          )}
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {renderField('phone', 'Teléfono', player.phone)}
          {renderField('dni', 'DNI', player.dni)}
          {renderField('birthdate', 'Nacimiento', player.birthdate ? new Date(player.birthdate).toLocaleDateString() : undefined)}
          <div className="flex flex-col gap-1 p-4 bg-bg-secondary border-2 border-border-subtle">
            <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Ubicación</span>
            <span className="text-sm font-black text-text-primary">{player.city || 'Desconocida'}</span>
          </div>
        </div>

        {/* Teams / Trajectory */}
        <div className="mb-10">
          <div className="flex items-end justify-between border-b-4 border-black pb-4 mb-6">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Trayectoria / Equipos</h2>
          </div>
          <div className="space-y-3">
            {player.teamMemberships?.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-bg-card border-2 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                    {m.team.logo ? <img src={m.team.logo} alt="" className="object-cover h-full w-full" /> : <Shield size={24} className="text-white/20" />}
                  </div>
                  <div>
                    <p className="font-black text-text-primary uppercase text-sm tracking-tight italic">{m.team.name}</p>
                    <p className="text-[10px] text-text-secondary font-black uppercase">{m.position || 'Gral'} • #{m.number || 'N/A'}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest ${m.isActive ? 'bg-accent-primary text-white' : 'bg-bg-secondary text-text-secondary border border-border-subtle'}`}>
                  {m.isActive ? 'Actual' : 'Pasado'}
                </div>
              </div>
            ))}
            {(!player.teamMemberships || player.teamMemberships.length === 0) && (
              <div className="py-20 text-center border-4 border-dashed border-black/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Sin equipos registrados.</p>
              </div>
            )}
          </div>
        </div>

        {/* Trophies Section */}
        {player.playerPrizes && player.playerPrizes.length > 0 && (
          <div>
            <div className="flex items-end justify-between border-b-4 border-black pb-4 mb-6">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Palmarés / Trofeos</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {player.playerPrizes.map((prize) => (
                <div key={prize.id} className="flex items-center gap-4 p-5 bg-bg-card border-2 border-black border-l-8 border-l-accent-gold">
                  <div className="h-14 w-14 bg-black flex items-center justify-center text-accent-gold border-b-4 border-accent-gold">
                    <Trophy size={28} />
                  </div>
                  <div>
                    <p className="font-black text-text-primary uppercase text-sm tracking-tight italic">{prize.title}</p>
                    <p className="text-[10px] text-accent-gold font-bold uppercase">{prize.year} {prize.description && `• ${prize.description}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, danger }: { label: string; value: number; highlight?: boolean; danger?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 border-2 border-black bg-bg-card ${highlight ? 'border-b-4 border-b-accent-primary' : danger ? 'border-b-4 border-b-red-600' : ''}`}>
      <span className={`text-2xl font-black italic ${highlight ? 'text-accent-primary' : danger ? 'text-red-600' : 'text-text-primary'}`}>{value}</span>
      <span className="text-[8px] font-black uppercase text-text-secondary tracking-tighter">{label}</span>
    </div>
  );
}
