'use client';

import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';
import { Shield, User, X } from 'lucide-react';
import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  lastName: string;
  image?: string;
  number?: number;
}

interface MatchLineupProps {
  matchId: string;
  team: { id: string; name: string };
  isHome: boolean;
  currentLineup: { player: Player; position: string; isStarting: boolean }[];
  teamPlayers: Player[];
  isAuthorized: boolean;
  onLineupSaved: () => void;
}

export function MatchLineup({
  matchId,
  team,
  isHome,
  currentLineup,
  teamPlayers,
  isAuthorized,
  onLineupSaved
}: MatchLineupProps) {
  const { success, error } = useAlert();
  const [isEditing, setIsEditing] = useState(false);
  const [starters, setStarters] = useState<any[]>(
    currentLineup.filter(l => l.isStarting).map(l => ({ ...l.player }))
  );
  const [subs, setSubs] = useState<any[]>(
    currentLineup.filter(l => !l.isStarting).map(l => ({ ...l.player }))
  );
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar jugadores disponibles (no están ni en titulares ni suplentes)
  const availablePlayers = teamPlayers.filter(
    p => !starters.find(s => s.id === p.id) && !subs.find(s => s.id === p.id)
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        teamId: team.id,
        players: [
          ...starters.map(p => ({ playerId: p.id, position: 'TITULAR', isStarting: true })),
          ...subs.map(p => ({ playerId: p.id, position: 'SUPLENTE', isStarting: false }))
        ]
      };
      await api.post(`/matches/${matchId}/lineups`, payload);
      success('Convocatoria y Alineación guardadas correctamente');
      setIsEditing(false);
      onLineupSaved();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al guardar alineación');
    } finally {
      setIsSaving(false);
    }
  };

  const addStarter = (player: Player) => {
    if (starters.length >= 11) {
      error('El equipo titular solo puede tener 11 jugadores');
      return;
    }
    setStarters(prev => [...prev, player]);
  };

  const addSub = (player: Player) => {
    setSubs(prev => [...prev, player]);
  };

  const removePlayer = (playerId: string, list: 'starters' | 'subs') => {
    if (list === 'starters') {
      setStarters(prev => prev.filter(p => p.id !== playerId));
    } else {
      setSubs(prev => prev.filter(p => p.id !== playerId));
    }
  };

  return (
    <div className="bg-bg-card border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full">
      <div className={`p-4 border-b-4 ${isHome ? 'border-accent-primary' : 'border-accent-secondary'} bg-black text-white flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <Shield size={20} className={isHome ? 'text-accent-primary' : 'text-accent-secondary'} />
          <h3 className="font-black uppercase tracking-widest text-sm">{team.name}</h3>
        </div>
        {isAuthorized && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[10px] bg-white/10 hover:bg-white text-white hover:text-black font-black uppercase px-3 py-1 transition-colors"
          >
            Editar Convocatoria / XI
          </button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setStarters(currentLineup.filter(l => l.isStarting).map(l => ({ ...l.player })));
                setSubs(currentLineup.filter(l => !l.isStarting).map(l => ({ ...l.player })));
                setIsEditing(false);
              }}
              className="text-[10px] bg-red-600 hover:bg-red-500 text-white font-black uppercase px-3 py-1 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="text-[10px] bg-accent-primary hover:bg-white text-black font-black uppercase px-3 py-1 transition-colors"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-6">
        {/* TITULARES */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">
              Titulares (11 Inicial)
            </h4>
            <span className={`text-[10px] font-black ${starters.length === 11 ? 'text-accent-primary' : 'text-text-secondary/50'}`}>
              {starters.length} / 11
            </span>
          </div>
          
          {starters.length === 0 ? (
            <div className="py-4 border-2 border-dashed border-border-subtle text-center text-[10px] uppercase font-black text-text-secondary/50">
              Sin titulares
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {starters.map((p, i) => (
                <PlayerRow 
                  key={p.id} 
                  player={p} 
                  index={i + 1} 
                  isEditing={isEditing} 
                  onRemove={() => removePlayer(p.id, 'starters')} 
                />
              ))}
            </div>
          )}
        </div>

        {/* SUPLENTES */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">
              Suplentes (Banco)
            </h4>
            <span className="text-[10px] font-black text-text-secondary/50">
              {subs.length}
            </span>
          </div>
          
          {subs.length === 0 ? (
            <div className="py-4 border-2 border-dashed border-border-subtle text-center text-[10px] uppercase font-black text-text-secondary/50">
              Sin suplentes
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subs.map((p, i) => (
                <PlayerRow 
                  key={p.id} 
                  player={p} 
                  index={starters.length + i + 1} 
                  isEditing={isEditing} 
                  onRemove={() => removePlayer(p.id, 'subs')} 
                  isSub
                />
              ))}
            </div>
          )}
        </div>

        {/* DISPONIBLES (Solo en edición) */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t-2 border-dashed border-border-subtle">
            <h4 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3">
              Jugadores No Convocados
            </h4>
            
            {availablePlayers.length === 0 ? (
              <div className="text-[10px] text-text-secondary/50 uppercase font-black">
                No hay más jugadores
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar">
                {availablePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between border border-border-subtle p-2 hover:border-accent-primary transition-colors bg-bg-secondary">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-border-subtle rounded-full flex items-center justify-center text-[8px] overflow-hidden">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <User size={12} />}
                      </div>
                      <span className="text-[10px] font-black uppercase truncate max-w-[120px]">
                        {p.name} {p.lastName}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => addStarter(p)}
                        disabled={starters.length >= 11}
                        className="text-[9px] font-black uppercase bg-bg-card border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                      >
                        T
                      </button>
                      <button 
                        onClick={() => addSub(p)}
                        className="text-[9px] font-black uppercase bg-bg-card border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
                      >
                        S
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ player, index, isEditing, onRemove, isSub = false }: any) {
  return (
    <div className={`flex items-center justify-between p-2 border-l-4 ${isSub ? 'border-border-subtle bg-bg-secondary/50' : 'border-black bg-bg-secondary'} group hover:border-accent-primary transition-colors`}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black tabular-nums text-text-secondary/40 w-4 text-right">
          {index}
        </span>
        <div className="w-6 h-6 bg-border-subtle rounded-full flex items-center justify-center text-[8px] overflow-hidden shrink-0">
          {player.image ? <img src={player.image} className="w-full h-full object-cover" /> : <User size={12} />}
        </div>
        <span className="text-xs font-black uppercase tracking-tight truncate">
          {player.name} {player.lastName}
        </span>
      </div>
      
      {isEditing && (
        <button 
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-red-600 hover:bg-white transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
