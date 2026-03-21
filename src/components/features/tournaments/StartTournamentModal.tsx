'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/context/AlertContext';
import { Calendar, Clock, Users, Shield, MapPin } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: any) => void;
    loading: boolean;
    tournamentName: string;
    tournamentType?: string;
}

const DAYS = [
    { id: 1, label: 'Lun' },
    { id: 2, label: 'Mar' },
    { id: 3, label: 'Mie' },
    { id: 4, label: 'Jue' },
    { id: 5, label: 'Vie' },
    { id: 6, label: 'Sab' },
    { id: 0, label: 'Dom' },
];

export function StartTournamentModal({ isOpen, onClose, onConfirm, loading, tournamentName, tournamentType }: Props) {
    const [playingDays, setPlayingDays] = useState<number[]>([6, 0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [gamesPerDay, setGamesPerDay] = useState(4);
    const [assignReferees, setAssignReferees] = useState(false);
    const [groupCount, setGroupCount] = useState(4);
    const [advancingCount, setAdvancingCount] = useState(2);
    const { error: showError } = useAlert();

    const toggleDay = (id: number) => {
        setPlayingDays(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        if (playingDays.length === 0) {
            showError('Debes seleccionar al menos un día de juego');
            return;
        }
        onConfirm({
            playingDays,
            startTime,
            endTime,
            gamesPerDay,
            assignRefereesRandomly: assignReferees,
            groupCount: tournamentType === 'GROUPS_ELIMINATION' ? groupCount : undefined,
            advancingCount: tournamentType === 'GROUPS_ELIMINATION' ? advancingCount : undefined
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configurar Inicio de Torneo">
            <div className="space-y-6 py-2">
                <div>
                    <p className="text-sm text-text-secondary mb-4">
                        Estás a punto de generar el fixture para <span className="text-text-primary font-bold">{tournamentName}</span>.
                        Define cómo quieres que se programen los encuentros:
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Days Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
                            <Calendar size={14} /> Días de Juego
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all tracking-widest ${playingDays.includes(day.id)
                                            ? 'bg-accent-primary text-white'
                                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-card'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
                                <Clock size={14} /> Hora Inicio
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
                                <Clock size={14} /> Hora Fin
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
                            />
                        </div>
                    </div>

                    {/* Games Per Day */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
                            <Users size={14} /> Partidos por día
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={gamesPerDay}
                            onChange={e => {
                                const val = parseInt(e.target.value);
                                if (val > 10) setGamesPerDay(10);
                                else setGamesPerDay(isNaN(val) ? '' : Math.max(1, val) as any);
                            }}
                            className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
                        />
                    </div>

                    {tournamentType === 'GROUPS_ELIMINATION' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
                                    <Users size={14} /> Cantidad de Grupos
                                </label>
                                <input
                                    type="number"
                                    min="2"
                                    max="16"
                                    value={groupCount}
                                    onChange={e => setGroupCount(parseInt(e.target.value))}
                                    className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-2 tracking-widest">
                                    <Shield size={14} /> Clasificados por Grupo
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    value={advancingCount}
                                    onChange={e => setAdvancingCount(parseInt(e.target.value))}
                                    className="w-full bg-bg-secondary border-2 border-black p-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
                                />
                            </div>
                        </div>
                    )}

                    {/* Auto Assign Referees */}
                    <div className="flex items-center justify-between p-5 bg-bg-secondary border-2 border-border-subtle">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-black flex items-center justify-center text-accent-primary border-b-4 border-accent-primary">
                                <Shield size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-text-primary uppercase italic">Árbitros Aleatorios</p>
                                <p className="text-[10px] text-text-secondary">Asignar automáticamente un árbitro a cada partido</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAssignReferees(!assignReferees)}
                            className={`w-12 h-6 transition-colors relative border-2 border-black ${assignReferees ? 'bg-accent-primary' : 'bg-bg-card'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white transition-transform ${assignReferees ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    {/* Auto Stadium Info */}
                    <div className="flex items-center gap-3 p-5 bg-bg-secondary border-2 border-border-subtle border-l-8 border-l-accent-primary">
                        <div className="h-10 w-10 bg-black flex items-center justify-center text-accent-primary border-b-4 border-accent-primary shrink-0">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] text-text-secondary leading-tight">
                                <span className="text-accent-primary font-black uppercase block mb-1">Estadios Automáticos</span>
                                El sistema usará el estadio de cada equipo local como sede predeterminada del encuentro.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button className="flex-1" onClick={handleConfirm} isLoading={loading}>
                        INICIAR TORNEO
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
