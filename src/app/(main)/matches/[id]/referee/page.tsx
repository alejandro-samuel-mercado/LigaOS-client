'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { api } from '@/adapters/http';
import {
    Play,
    Pause,
    Square,
    ChevronLeft,
    Timer,
    AlertCircle,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export default function RefereePanelPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = params['id'] as string;
    const { user } = useAuth();
    const { success, error: showError } = useAlert();

    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<'event' | 'postpone' | 'annul' | 'finish' | 'injury' | null>(null);

    // Real-time timer state
    const [displayMinute, setDisplayMinute] = useState<number>(0);
    const [timerDisplay, setTimerDisplay] = useState('00:00');
    const [isAlerting, setIsAlerting] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [lastAlarm, setLastAlarm] = useState<string>('');

    // Injury time input
    const [injuryMinutes, setInjuryMinutes] = useState('0');
    const [injuryType, setInjuryType] = useState<'injuryTime1' | 'injuryTime2' | 'injuryTimeET1' | 'injuryTimeET2'>('injuryTime1');

    // Event state (for modal)
    const [eventType, setEventType] = useState('GOAL');
    const [eventTeamSide, setEventTeamSide] = useState<'home' | 'away'>('home');
    const [eventPlayerId, setEventPlayerId] = useState('');
    const [eventDetails, setEventDetails] = useState('');

    // Postpone state
    const [postponeDate, setPostponeDate] = useState('');
    const [postponeTime, setPostponeTime] = useState('');

    // Finish match state
    const [hasExtraTime, setHasExtraTime] = useState(false);
    const [hasPenalties, setHasPenalties] = useState(false);
    const [homePenalties, setHomePenalties] = useState('');
    const [awayPenalties, setAwayPenalties] = useState('');

    const fetchMatch = async () => {
        try {
            const { data } = await api.get(`/matches/${matchId}`);
            setMatch(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Audio alert function using Web Audio API (beep)
    const playAlertSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
        } catch (e) { console.error('Audio alert failed', e); }
    };

    const triggerAlert = (msg: string) => {
        setIsAlerting(true);
        setAlertMessage(msg);
        playAlertSound();
        setTimeout(() => setIsAlerting(false), 5000);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!match) return;

            let diffMs = 0;
            let displayMin = 0;
            let displaySec = 0;
            let totalSec = 0;

            if (match.status === 'LIVE') {
                const startTime = match.secondHalfStartTime || match.actualStartTime;
                if (startTime) {
                    diffMs = Date.now() - new Date(startTime).getTime();
                    totalSec = Math.floor(diffMs / 1000);
                    const baseMin = match.secondHalfStartTime ? 45 : 0;
                    displayMin = baseMin + Math.floor(totalSec / 60);
                    displaySec = totalSec % 60;
                }
            } else if (match.status === 'HALFTIME') {
                const startTime = new Date(match.updatedAt).getTime();
                diffMs = Date.now() - startTime;
                totalSec = Math.floor(diffMs / 1000);
                displayMin = Math.floor(totalSec / 60);
                displaySec = totalSec % 60;
            } else if (match.status === 'UPCOMING') {
                displayMin = 0;
                displaySec = 0;
            } else if (match.status === 'FINISHED') {
                displayMin = 90 + (match.injuryTime1 || 0) + (match.injuryTime2 || 0);
                displaySec = 0;
            }

            const formatted = `${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`;
            setTimerDisplay(formatted);
            setDisplayMinute(displayMin);

            // Alarms logic
            if (match.status === 'LIVE') {
                if (!match.secondHalfStartTime) {
                    // 1st Half
                    if (displayMin === 45 && displaySec === 0 && lastAlarm !== '45_FIRST') {
                        triggerAlert('¡45 MINUTOS CUMPLIDOS! (1er TIEMPO)');
                        setLastAlarm('45_FIRST');
                    }
                    const it1 = match.injuryTime1 || 0;
                    if (it1 > 0 && displayMin === 45 + it1 && displaySec === 0 && lastAlarm !== 'IT1_END') {
                        triggerAlert('¡TIEMPO ADICIONAL CUMPLIDO! (1er TIEMPO)');
                        setLastAlarm('IT1_END');
                    }
                } else {
                    // 2nd Half
                    if (displayMin === 90 && displaySec === 0 && lastAlarm !== '90_SECOND') {
                        triggerAlert('¡90 MINUTOS CUMPLIDOS! (FIN TIEMPO REGLAMENTARIO)');
                        setLastAlarm('90_SECOND');
                    }
                    if (displayMin === 105 && displaySec === 0 && lastAlarm !== '105_ET1') {
                        triggerAlert('¡FIN PRIMER TIEMPO EXTRA (105 MIN)!');
                        setLastAlarm('105_ET1');
                    }
                    if (displayMin === 120 && displaySec === 0 && lastAlarm !== '120_ET2') {
                        triggerAlert('¡FIN SEGUNDO TIEMPO EXTRA (120 MIN)!');
                        setLastAlarm('120_ET2');
                    }
                    const it2 = match.injuryTime2 || 0;
                    if (it2 > 0 && displayMin === 90 + it2 && displaySec === 0 && lastAlarm !== 'IT2_END') {
                        triggerAlert('¡TIEMPO ADICIONAL CUMPLIDO! (2do TIEMPO)');
                        setLastAlarm('IT2_END');
                    }
                }
            } else if (match.status === 'HALFTIME') {
                if (displayMin === 15 && displaySec === 0 && lastAlarm !== 'HALFTIME_END') {
                    triggerAlert('¡ENTRETIEMPO FINALIZADO (15 MIN)!');
                    setLastAlarm('HALFTIME_END');
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [match, lastAlarm]);

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'REFEREE' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN'))) {
            router.push('/');
            return;
        }
        fetchMatch();
    }, [matchId, loading, user, router]);

    const handleUpdateStatus = async (status: string, payload: any = {}) => {
        try {
            await api.patch(`/matches/status/${matchId}`, { status, ...payload });
            success('Estado actualizado correctamente');
            setActiveModal(null);
            fetchMatch();
        } catch (err: any) {
            showError(err.details?.message || err.message || 'Error al actualizar estado');
        }
    };

    const handleScoreChange = async (side: 'home' | 'away', delta: number) => {
        if (match.status !== 'LIVE') return; // Restriction: cannot edit during halftime
        try {
            const currentScore = side === 'home' ? match.homeGoals : match.awayGoals;
            const newScore = Math.max(0, currentScore + delta);

            if (delta > 0) {
                await api.post(`/matches/${matchId}/events`, {
                    type: 'GOAL',
                    teamSide: side,
                    details: 'Gol directo desde el panel'
                });
            } else {
                await api.patch(`/matches/status/${matchId}`, { [side === 'home' ? 'homeGoals' : 'awayGoals']: newScore });
            }
            fetchMatch();
            success('Marcador actualizado');
        } catch (err: any) {
            showError('No se pudo actualizar el marcador');
        }
    };

    const handleQuickEvent = async (type: string, side: 'home' | 'away') => {
        if (match.status !== 'LIVE') {
            showError('Solo puedes registrar incidencias mientras el partido está en juego');
            return;
        }
        setEventType(type);
        setEventTeamSide(side);
        setActiveModal('event');
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/matches/${matchId}/events`, {
                type: eventType,
                teamSide: eventTeamSide,
                playerId: eventPlayerId || undefined,
                details: eventDetails || undefined
            });
            success('Incidencia guardada');
            setActiveModal(null);
            setEventDetails('');
            setEventPlayerId('');
            fetchMatch();
        } catch (err: any) {
            showError('Error al guardar incidencia');
        }
    };

    const handleSaveInjuryTime = async () => {
        try {
            await api.patch(`/matches/status/${matchId}`, { [injuryType]: parseInt(injuryMinutes) });
            success('Tiempo adicional guardado');
            setActiveModal(null);
            fetchMatch();
        } catch (err) {
            showError('Error al guardar tiempo adicional');
        }
    };

    if (loading) return <div className="p-8 text-center font-black uppercase tracking-widest animate-pulse">Cargando Panel...</div>;
    if (!match) return <div className="p-8 text-center text-red-500 font-black uppercase">Partido no encontrado</div>;

    const isEliminatory = match.tournament?.type === 'ELIMINATION' || match.tournament?.type === 'GROUPS_ELIMINATION';
    const canEdit = match.status === 'LIVE';
    const canFinish = match.status === 'LIVE' && match.secondHalfStartTime;

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 font-inter relative overflow-hidden">
            {/* ALERT OVERLAY */}
            {isAlerting && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-red-600 opacity-40 animate-pulse" />
                    <div className="bg-black border-4 border-accent-primary p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                        <h2 className="text-4xl md:text-6xl font-black italic text-accent-primary text-center uppercase tracking-tighter">
                            {alertMessage}
                        </h2>
                    </div>
                </div>
            )}

            {/* Header compact */}
            <div className="bg-black text-white p-6 border-b-4 border-accent-primary flex items-center justify-between sticky top-0 z-30 shadow-xl">
                <button onClick={() => router.back()} className="text-accent-primary hover:scale-110 transition-transform">
                    <ChevronLeft size={32} strokeWidth={3} />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary animate-pulse">
                        {match.status === 'UPCOMING' ? 'POR INICIAR' : match.status === 'LIVE' ? 'EN VIVO' : match.status === 'HALFTIME' ? 'ENTRETIEMPO' : match.status}
                    </p>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">Panel Árbitro</h1>
                </div>
                <div className="flex flex-col items-end mr-10">
                    <span className=" text-[9px] font-bold opacity-50 uppercase leading-none mb-1">Cronómetro</span>
                    <span className="text-3xl font-black italic tabular-nums text-accent-primary">{timerDisplay}</span>
                </div>
            </div>

            <div className="main-container px-4 py-8 space-y-8 max-w-5xl mx-auto">

                {/* SCOREBOARD SECTION */}
                <div className="grid grid-cols-2 gap-4 bg-black p-4 md:p-8 border-b-8 border-accent-primary shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                    <TeamControl
                        team={match.homeTeam}
                        score={match.homeGoals}
                        disabled={!canEdit}
                        onScoreChange={(d: number) => handleScoreChange('home', d)}
                        onQuickEvent={(t: string) => handleQuickEvent(t, 'home')}
                    />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-[2px] bg-white/20 hidden md:block" />
                    <TeamControl
                        team={match.awayTeam}
                        score={match.awayGoals}
                        disabled={!canEdit}
                        onScoreChange={(d: number) => handleScoreChange('away', d)}
                        onQuickEvent={(t: string) => handleQuickEvent(t, 'away')}
                    />
                </div>

                {match.status === 'UPCOMING' && (
                    <div className="bg-accent-secondary/10 border-2 border-accent-secondary p-6 text-center space-y-4">
                        <AlertCircle className="mx-auto text-accent-secondary" size={32} />
                        <p className="text-sm font-black uppercase tracking-widest text-accent-secondary">El partido aún no ha comenzado</p>
                        <p className="text-xs text-text-secondary">Inicia el primer tiempo para habilitar los controles de marcador e incidencias.</p>
                        <Button
                            onClick={() => handleUpdateStatus('LIVE')}
                            className="w-full h-16 bg-accent-primary text-black font-black text-lg hover:bg-white transition-all shadow-xl"
                        >
                            <Play size={20} className="mr-2" /> INICIAR PRIMER TIEMPO
                        </Button>
                    </div>
                )}

                {/* CONTROLS GRID */}
                {(match.status === 'LIVE' || match.status === 'HALFTIME') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Period Controls */}
                        <div className="bg-bg-card border-2 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Control de Flujo</h3>
                            <div className="flex flex-col gap-3">
                                {match.status === 'LIVE' && !match.secondHalfStartTime && (
                                    <Button
                                        onClick={() => handleUpdateStatus('HALFTIME')}
                                        className="h-16 bg-accent-gold text-black font-black border-2 border-black hover:bg-accent-secondary"
                                    >
                                        <Pause size={18} className="mr-2" /> FINALIZAR 1er TIEMPO (IR A ENTRETIEMPO)
                                    </Button>
                                )}

                                {match.status === 'HALFTIME' && (
                                    <Button
                                        onClick={() => handleUpdateStatus('LIVE')}
                                        className="h-16 bg-accent-primary text-black font-black border-2 border-black hover:bg-white"
                                    >
                                        <Play size={18} className="mr-2" /> INICIAR SEGUNDO TIEMPO
                                    </Button>
                                )}

                                {match.status === 'LIVE' && match.secondHalfStartTime && (
                                    <div className="space-y-3">
                                        {isEliminatory && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button onClick={() => setActiveModal('injury')} variant="secondary" className="h-12 border-2 border-black font-black text-[10px]">
                                                    TIEMPO EXTRA
                                                </Button>
                                                <Button onClick={() => setActiveModal('finish')} variant="secondary" className="h-12 border-2 border-black font-black text-[10px]">
                                                    TANDA PENALES
                                                </Button>
                                            </div>
                                        )}

                                        <Button
                                            onClick={() => setActiveModal('finish')}
                                            className="w-full h-16 bg-red-600 text-white font-black border-2 border-black hover:bg-accent-secondary hover:text-black transition-all shadow-lg"
                                        >
                                            <Square size={18} className="mr-2" /> FINALIZAR PARTIDO DEFINITIVAMENTE
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Injury Time */}
                        <div className="bg-bg-card border-2 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Adicionar Minutos</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <StatusControl
                                    label="1er Tiempo"
                                    value={match.injuryTime1}
                                    onClick={() => { setInjuryType('injuryTime1'); setInjuryMinutes((match.injuryTime1 || 0).toString()); setActiveModal('injury'); }}
                                />
                                <StatusControl
                                    label="2do Tiempo"
                                    value={match.injuryTime2}
                                    onClick={() => { setInjuryType('injuryTime2'); setInjuryMinutes((match.injuryTime2 || 0).toString()); setActiveModal('injury'); }}
                                />
                                {isEliminatory && (
                                    <>
                                        <StatusControl
                                            label="Alargue 1"
                                            value={match.injuryTimeET1}
                                            onClick={() => { setInjuryType('injuryTimeET1'); setInjuryMinutes((match.injuryTimeET1 || 0).toString()); setActiveModal('injury'); }}
                                        />
                                        <StatusControl
                                            label="Alargue 2"
                                            value={match.injuryTimeET2}
                                            onClick={() => { setInjuryType('injuryTimeET2'); setInjuryMinutes((match.injuryTimeET2 || 0).toString()); setActiveModal('injury'); }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Other Actions Footer */}
                <div className="pt-8 border-t-2 border-black/10 flex flex-col md:flex-row gap-4">
                    <Button onClick={() => setActiveModal('postpone')} variant="secondary" className="flex-1 text-[10px] border-2 border-black font-black h-12 bg-gray-600 hover:bg-accent-gold transition-colors">
                        <Timer size={14} className="mr-2" /> REPROGRAMAR PARA OTRO DÍA
                    </Button>
                    <Button onClick={() => setActiveModal('annul')} variant="secondary" className="flex-1 text-[10px] border-2 border-black font-black h-12 bg-gray-600  text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                        <AlertCircle size={14} className="mr-2" /> ANULAR (SIN PUNTOS)
                    </Button>
                </div>
            </div>

            {/* MODALS */}
            <Modal isOpen={activeModal === 'event'} onClose={() => setActiveModal(null)} title="Registrar Incidencia">
                <form onSubmit={handleSaveEvent} className="space-y-4">
                    <div className="p-6 bg-black text-white text-center font-black italic uppercase border-b-8 border-accent-primary text-xl">
                        {eventType === 'GOAL' ? '⚽ GOL' : eventType === 'YELLOW_CARD' ? '🟨 AMARILLA' : '🟥 ROJA'}
                        <p className="text-[10px] tracking-widest mt-1 text-accent-primary font-bold">
                            {eventTeamSide === 'home' ? match.homeTeam.name : match.awayTeam.name}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-text-secondary">Jugador implicado (opcional):</p>
                        <select
                            value={eventPlayerId}
                            onChange={e => setEventPlayerId(e.target.value)}
                            className="w-full bg-bg-secondary border-2 border-black p-3 text-xs font-black uppercase outline-none focus:border-accent-primary"
                        >
                            <option value="">-- Seleccionar Jugador --</option>
                            {(eventTeamSide === 'home' ? match.homeTeam : match.awayTeam)?.lineups?.map((l: any) => (
                                <option key={l.player.id} value={l.player.id}>
                                    {l.player.name} {l.player.lastName}
                                </option>
                            ))}
                        </select>

                        <Input label="Comentario Adicional" placeholder="Ej: De penal, tiro libre..." value={eventDetails} onChange={e => setEventDetails(e.target.value)} />
                    </div>

                    <Button type="submit" className="w-full h-14 bg-accent-primary text-black font-black uppercase tracking-widest mt-4 hover:bg-white transition-all">
                        CONFIRMAR REGISTRO
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={activeModal === 'injury'} onClose={() => setActiveModal(null)} title="Adicionar Tiempo">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-text-secondary opacity-60 text-center">Minutos de adición sugeridos</p>
                    <div className="flex justify-center flex-col items-center gap-6 p-4">
                        <input
                            type="number"
                            value={injuryMinutes}
                            onChange={e => setInjuryMinutes(e.target.value)}
                            className="text-7xl font-black text-center w-40 bg-bg-secondary border-4 border-black outline-none focus:border-accent-primary py-4 italic"
                        />
                        <Button onClick={handleSaveInjuryTime} className="w-full h-14 font-black bg-black text-white hover:bg-accent-primary hover:text-black">
                            GUARDAR CAMBIOS
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={activeModal === 'postpone'} onClose={() => setActiveModal(null)} title="Reprogramar Partido">
                <div className="space-y-4">
                    <div className="p-4 bg-accent-gold/10 border-2 border-accent-gold text-accent-gold text-[10px] font-black uppercase leading-tight">
                        El partido se moverá a una nueva fecha sin afectar la tabla actual.
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <Input type="date" label="Nueva Fecha" value={postponeDate} onChange={e => setPostponeDate(e.target.value)} />
                        <Input type="time" label="Nueva Hora" value={postponeTime} onChange={e => setPostponeTime(e.target.value)} />
                    </div>
                    <Button
                        onClick={() => handleUpdateStatus('POSTPONED', { matchDate: postponeDate, matchTime: postponeTime })}
                        className="w-full h-14 bg-black text-white font-black hover:bg-accent-gold hover:text-black mt-4"
                        disabled={!postponeDate}
                    >
                        REPROGRAMAR PARTIDO
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={activeModal === 'annul'} onClose={() => setActiveModal(null)} title="Anulación Definitiva">
                <div className="space-y-6">
                    <div className="flex items-start gap-3 p-6 bg-red-600 text-white border-b-8 border-black">
                        <AlertCircle size={40} className="shrink-0" />
                        <div>
                            <p className="text-sm font-black uppercase italic mb-1">¡Acción Irreversible!</p>
                            <p className="text-[10px] font-bold opacity-80 leading-relaxed">
                                Este partido se marcará como ANULADO. Ningún equipo sumará puntos y las incidencias quedarán invalidadas para la tabla general.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => handleUpdateStatus('ANNULLED')} className="w-full h-16 bg-black text-red-600 font-black border-2 border-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xl">
                        CONFIRMAR ANULACIÓN DEL ENCUENTRO
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={activeModal === 'finish'} onClose={() => setActiveModal(null)} title="Cerrar Partido">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`flex flex-col items-center gap-2 p-4 border-2 border-black transition-all cursor-pointer ${hasExtraTime ? 'bg-black text-white' : 'bg-bg-secondary'}`}>
                            <input type="checkbox" checked={hasExtraTime} onChange={e => setHasExtraTime(e.target.checked)} className="h-5 w-5 accent-accent-primary" />
                            <span className="text-[9px] font-black uppercase text-center">HUBO ALARGUE</span>
                        </label>
                        <label className={`flex flex-col items-center gap-2 p-4 border-2 border-black transition-all cursor-pointer ${hasPenalties ? 'bg-black text-white' : 'bg-bg-secondary'}`}>
                            <input type="checkbox" checked={hasPenalties} onChange={e => setHasPenalties(e.target.checked)} className="h-5 w-5 accent-accent-primary" />
                            <span className="text-[9px] font-black uppercase text-center">HUBO PENALES</span>
                        </label>
                    </div>

                    {hasPenalties && (
                        <div className="p-6 border-2 border-black bg-black text-white space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-accent-primary text-center">RESULTADO DE LA TANDA</p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-bold uppercase opacity-50 block text-center truncate">{match.homeTeam.name}</span>
                                    <input
                                        type="number"
                                        value={homePenalties}
                                        onChange={e => setHomePenalties(e.target.value)}
                                        className="w-full bg-white text-black text-center font-black py-4 text-3xl outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] font-bold uppercase opacity-50 block text-center truncate">{match.awayTeam.name}</span>
                                    <input
                                        type="number"
                                        value={awayPenalties}
                                        onChange={e => setAwayPenalties(e.target.value)}
                                        className="w-full bg-white text-black text-center font-black py-4 text-3xl outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => handleUpdateStatus('FINISHED', {
                            hasExtraTime,
                            hasPenalties,
                            homePenalties: hasPenalties ? parseInt(homePenalties) || 0 : undefined,
                            awayPenalties: hasPenalties ? parseInt(awayPenalties) || 0 : undefined
                        })}
                        className="w-full h-16 font-black bg-accent-primary text-black border-4 border-black hover:bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        GUARDAR RESULTADO FINAL
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

function TeamControl({ team, score, onScoreChange, onQuickEvent, disabled }: any) {
    return (
        <div className={`flex flex-col items-center space-y-6 transition-opacity ${disabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <div className="flex flex-col items-center">
                <div className="h-24 w-24 bg-white border-4 border-accent-primary mb-3 overflow-hidden shadow-2xl p-2 -rotate-2">
                    {team?.logo ? <img src={team.logo} className="h-full w-full object-contain" /> : <div className="h-full w-full bg-black text-accent-primary flex items-center justify-center font-black text-3xl italic">{team?.name?.[0]}</div>}
                </div>
                <h2 className="text-xs font-black uppercase text-white tracking-[0.2em] text-center truncate w-full max-w-[160px] drop-shadow-lg italic">{team?.nameShort || team?.name}</h2>
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => onScoreChange(-1)}
                        className="h-12 w-12 bg-white text-black rounded-none flex items-center justify-center border-b-4 border-accent-primary hover:bg-accent-gold transition-all font-black text-2xl"
                    >
                        -
                    </button>
                    <div className="text-8xl font-black italic text-accent-primary [text-shadow:6px_6px_0px_rgba(0,0,0,1)] select-none tabular-nums">
                        {score}
                    </div>
                    <button
                        onClick={() => onScoreChange(1)}
                        className="h-12 w-12 bg-white text-black rounded-none flex items-center justify-center border-b-4 border-accent-primary hover:bg-accent-primary transition-all font-black text-2xl"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-[200px]">
                <QuickButton icon="⚽" label="GOL" color="bg-white" onClick={() => onQuickEvent('GOAL')} />
                <QuickButton icon="🟨" label="TAR" color="bg-accent-gold" onClick={() => onQuickEvent('YELLOW_CARD')} />
                <QuickButton icon="🟥" label="TAR" color="bg-red-600" onClick={() => onQuickEvent('RED_CARD')} />
            </div>
        </div>
    );
}

function QuickButton({ icon, label, color, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`h-16 ${color || 'bg-white/5'} border-2 border-black flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]`}
        >
            <span className="text-2xl">{icon}</span>
            <span className={`text-[8px] font-black mt-1 opacity-60 leading-none ${color === 'bg-red-600' ? 'text-white' : 'text-black'}`}>{label}</span>
        </button>
    );
}

function StatusControl({ label, value, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="bg-white border-2 border-black p-4 text-center group hover:bg-accent-primary transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
            <p className="text-[9px] font-black uppercase text-black/40 mb-1 group-hover:text-black">{label}</p>
            <p className="text-2xl font-black italic text-black">+{value || 0}'</p>
        </button>
    );
}
