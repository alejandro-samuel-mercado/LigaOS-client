'use client';

import { api } from '@/adapters/http';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Calendar, Clock, MapPin, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  onUpdate: () => void;
}

export function EditMatchModal({ isOpen, onClose, match, onUpdate }: Props) {
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [stadium, setStadium] = useState('');
  const [refereeId, setRefereeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [referees, setReferees] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      const d = new Date(match.matchDate);
      const localDateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
      setMatchDate(localDateStr);
      setMatchTime(match.matchTime || '');
      setStadium(match.stadium || '');
      setRefereeId(match.refereeId || '');
    }
  }, [match]);

  useEffect(() => {
    const fetchReferees = async () => {
      try {
        const { data } = await api.get('/users?role=REFEREE');
        setReferees(data.data || []);
      } catch (err) {
      }
    };
    if (isOpen) fetchReferees();
  }, [isOpen]);

  const handleUpdate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.patch(`/tournaments/matches/${match.id}`, {
        matchDate: new Date(matchDate + 'T00:00:00').toISOString(),
        matchTime,
        stadium,
        refereeId: refereeId || null,
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al actualizar partido';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Partido">
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-center gap-4 py-4 mb-4 bg-black text-white border-b-4 border-accent-primary">
           <span className="text-xs font-black uppercase italic">{match?.homeTeam?.name}</span>
           <span className="text-[10px] text-white/30 font-black uppercase">vs</span>
           <span className="text-xs font-black uppercase italic">{match?.awayTeam?.name}</span>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 p-3 mb-4">
            <p className="text-red-500 text-xs font-black uppercase tracking-wider">{errorMsg}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
            <Calendar size={14} /> Fecha
          </label>
          <input
            type="date"
            value={matchDate}
            onChange={e => setMatchDate(e.target.value)}
            className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
            <Clock size={14} /> Hora
          </label>
          <input
            type="time"
            value={matchTime}
            onChange={e => setMatchTime(e.target.value)}
            className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
            <MapPin size={14} /> Estadio / Sede
          </label>
          <input
            type="text"
            value={stadium}
            onChange={e => setStadium(e.target.value)}
            placeholder="Nombre del estadio"
            className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
            <Shield size={14} /> Árbitro
          </label>
          <select
            value={refereeId}
            onChange={e => setRefereeId(e.target.value)}
            className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary appearance-none"
          >
            <option value="">Sin árbitro asignado</option>
            {referees.map(r => (
              <option key={r.id} value={r.id}>{r.name} {r.lastName}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleUpdate} isLoading={loading}>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}
