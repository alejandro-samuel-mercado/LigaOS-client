'use client';

import { api } from '@/adapters/http';
import { MATCH_EVENT_LABELS, MATCH_STATUS_LABELS } from '@/content/match';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronLeft,
    Clock,
    Edit2,
    MapPin,
    Shield,
    Users,
    Video,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MatchLineupsSection } from '@/components/matches/MatchLineupsSection';
import { useAlert } from '@/context/AlertContext';
import { useSocket } from '@/context/SocketContext';
import { usePersistentData } from '@/hooks/usePersistentData';

interface Match {
    id: string;
    matchDate: string;
    matchTime: string | null;
    status: string;
    homeGoals: number;
    awayGoals: number;
    stadium: string | null;
    groupName: string | null;
    tournament: { id: string; name: string };
    homeTeam: { id: string; name: string; logo: string | null; stadium: string | null; nameShort?: string | null };
    awayTeam: { id: string; name: string; logo: string | null; nameShort?: string | null };
    referee?: { id: string; name: string; lastName: string };
    refereeAssignment?: {
        status: string;
        referee: { id: string; name: string; lastName: string };
    };
    homePenalties: number | null;
    awayPenalties: number | null;
    hasExtraTime: boolean;
    hasPenalties: boolean;
    events: any[];
    actualStartTime?: string | null;
    secondHalfStartTime?: string | null;
    injuryTime1?: number | null;
    injuryTime2?: number | null;
    updatedAt: string;
    stream?: { streamUrl: string; isActive?: boolean } | null;
}

export default function MatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const matchId = params['id'] as string;

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const { data: match, loading, refresh: fetchMatch, setData: setMatch } = usePersistentData<Match>(
        `match_detail_${matchId}`,
        async () => {
            const { data } = await api.get(`/matches/${matchId}?t=${Date.now()}`);
            return data.data;
        },
        [matchId]
    );
    // Timer state
    const [timerDisplay, setTimerDisplay] = useState('00:00');

    const { data: availableRefereesRaw } = usePersistentData<any[]>(
        'available_referees',
        async () => {
            if (!isAdmin) return [];
            const { data } = await api.get('/users?role=REFEREE');
            return data.data;
        },
        [isAdmin]
    );
    const availableReferees = availableRefereesRaw || [];

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editedDate, setEditedDate] = useState('');
    const [editedTime, setEditedTime] = useState('');

    // Stream state
    const { success, error: showError } = useAlert();
    const [showStreamModal, setShowStreamModal] = useState(false);
    const [streamUrl, setStreamUrl] = useState('');

    // Comment state
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Dialog states
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null);

    useEffect(() => {
        if (match) {
            const d = new Date(match.matchDate);
            const localDateStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
            setEditedDate(localDateStr);
            setEditedTime(match.matchTime || '');
        }
    }, [match]);

    // Setup real-time updates
    const { joinRoom, leaveRoom, subscribe } = useSocket();

    useEffect(() => {
        if (matchId) {
            joinRoom(matchId);
            return () => leaveRoom(matchId);
        }
    }, [matchId, joinRoom, leaveRoom]);

    useEffect(() => {
        const unsubs = [
            subscribe('match:event', (event: any) => {
                setMatch((prev: any) => {
                    if (!prev) return prev;
                    return { ...prev, events: [...(prev.events || []), event] };
                });
                success('¡Nuevo evento en el partido!');
            }),
            subscribe('match:score_update', (data: any) => {
                setMatch((prev: any) => {
                    if (!prev) return prev;
                    if (data.homeGoals !== undefined) prev.homeGoals = data.homeGoals;
                    if (data.awayGoals !== undefined) prev.awayGoals = data.awayGoals;
                    return { ...prev };
                });
            }),
            subscribe('match:status_change', (data: any) => {
                setMatch((prev: any) => {
                    if (!prev) return prev;
                    return { ...prev, status: data.status };
                });
            })
        ];
        return () => unsubs.forEach(unsub => unsub());
    }, [subscribe, setMatch, success]);

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

            setTimerDisplay(`${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [match]);

    const handleUpdateMatch = async () => {
        try {
            await api.patch(`/matches/${matchId}`, {
                matchDate: new Date(editedDate + 'T00:00:00').toISOString(),
                matchTime: editedTime
            });
            setIsEditing(false);
            fetchMatch();
            triggerConfirm('Éxito', 'Partido actualizado correctamente', () => { });
        } catch (err: any) {
            triggerConfirm('Error', err.message || 'Error al actualizar partido', () => { });
        }
    };

    const handleRandomReferee = async () => {
        triggerConfirm(
            '¿Asignar árbitro aleatorio?',
            'Se seleccionará un árbitro de forma automática para este partido.',
            async () => {
                try {
                    await api.post(`/matches/${matchId}/referee/random`);
                    await fetchMatch();
                } catch (err: any) {
                    console.log(err);
                    triggerConfirm('Error', err.details.message || 'Error al asignar árbitro', () => { });
                }
            }
        );
    };

    const handleManualReferee = async (refereeId: string) => {
        if (!refereeId) return;
        try {
            await api.post(`/matches/${matchId}/referee`, { refereeId, method: 'MANUAL' });
            await fetchMatch();
        } catch (err: any) {
            triggerConfirm('Error', err.message || 'Error al asignar árbitro', () => { });
        }
    };

    const triggerConfirm = (title: string, message: string, action: () => void) => {
        setConfirmAction({ title, message, action });
        setShowConfirm(true);
    };

    const handleStartStream = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const trimmedUrl = streamUrl.trim();
            await api.post(`/streaming/matches/${matchId}`, { streamUrl: trimmedUrl });
            setShowStreamModal(false);
            setStreamUrl('');
            success('Transmisión iniciada correctamente');
            fetchMatch();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al iniciar transmisión.');
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            await api.post(`/matches/${matchId}/comments`, { text: newComment });
            setNewComment('');
            success('Comentario publicado');
            fetchMatch();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al publicar comentario');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        const trimmedUrl = url.trim();

        let videoId = '';

        // 1. Standard YouTube patterns (watch?v=, embed/, v/, y2u.be/, etc)
        const ytRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = trimmedUrl.match(ytRegex);

        if (match && match[2].length === 11) {
            videoId = match[2];
        } else {
            // 2. Extra patterns for /live/ and /shorts/ and /v/
            const liveMatch = trimmedUrl.match(/\/(?:live|shorts|v|embed)\/([a-zA-Z0-9_-]{11})/);
            if (liveMatch) {
                videoId = liveMatch[1];
            } else {
                // 3. Last resort: just look for an 11-char string that looks like a YT ID if it's a youtube domain
                if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
                    const genericMatch = trimmedUrl.match(/[a-zA-Z0-9_-]{11}/);
                    // This is risky but likely to work for shared links
                    if (genericMatch) videoId = genericMatch[0];
                }
            }
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // Twitch logic
        const twitchRegExp = /twitch\.tv\/([a-z0-9_]+)/i;
        const twitchMatch = trimmedUrl.match(twitchRegExp);
        if (twitchMatch) {
            const channel = twitchMatch[1];
            const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
            return `https://player.twitch.tv/?channel=${channel}&parent=${domain}`;
        }

        return null;
    };

    if (loading && !match) return <div className="p-8 text-center text-text-secondary">Cargando partido...</div>;
    if (!match) return <div className="p-8 text-center text-red-500">Partido no encontrado</div>;

    const streamEmbedUrl = getEmbedUrl(match.stream?.streamUrl || '');
    const isReferee = match.referee?.id === user?.id;
    const hasActiveStream = !!match.stream?.streamUrl && match.stream?.isActive !== false;

    return (
        <div className="min-h-screen bg-bg-primary pb-32 mesh-bg">
            {/* Hero Header */}
            <div className="relative bg-black border-b-8 border-accent-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />

                <button onClick={() => router.back()} className="absolute top-6 left-6 h-12 w-12 flex items-center justify-center bg-white/10 text-white border-2 border-white/20 hover:bg-white hover:text-black transition-all z-20">
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>

                <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-12 max-sm:pt-20">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black uppercase text-accent-primary tracking-[0.3em]">{match.tournament.name}</span>
                        {match.groupName && (
                            <span className="px-2 py-0.5 bg-accent-primary text-black text-[8px] font-black border border-black transform -skew-x-12">
                                GRUPO {match.groupName}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-8 w-full max-w-2xl mt-2">
                        <TeamHeaderDisplay team={match.homeTeam} />
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex flex-col items-center gap-2">
                                <div className="bg-white text-black px-8 py-4 border-b-4 border-accent-primary shadow-xl flex items-center gap-4">
                                    {match.hasPenalties && (
                                        <span className="text-xl font-black text-accent-primary italic">({match.homePenalties ?? 0})</span>
                                    )}
                                    <span className="text-5xl max-sm:text-3xl font-black tabular-nums tracking-tighter italic">
                                        {match.homeGoals} <span className="text-black/20 mx-1">:</span> {match.awayGoals}
                                    </span>
                                    {match.hasPenalties && (
                                        <span className="text-xl font-black text-accent-primary italic">({match.awayPenalties ?? 0})</span>
                                    )}
                                </div>
                                {match.hasPenalties && (
                                    <span className="text-[10px] font-black uppercase text-accent-primary tracking-[0.2em]">Definido por Penales</span>
                                )}
                                {match.hasExtraTime && !match.hasPenalties && (
                                    <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Tiempo Extra</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${match.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                                    match.status === 'FINISHED' ? 'bg-black text-white border border-white/20' :
                                        match.status === 'POSTPONED' ? 'bg-accent-gold text-black' :
                                            match.status === 'ANNULLED' ? 'bg-red-900 text-white' :
                                                match.status === 'HALFTIME' ? 'bg-accent-gold text-black' :
                                                    'bg-white/10 text-white/60'
                                    }`}>
                                    {match.status === 'LIVE' ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[20px] font-black italic tabular-nums">{timerDisplay}</span>
                                            <span className="text-[8px] opacity-60">Tiempo Transcurrido</span>
                                        </div>
                                    ) : (MATCH_STATUS_LABELS[match.status] || match.status)}
                                </span>
                            </div>
                        </div>
                        <TeamHeaderDisplay team={match.awayTeam} />
                    </div>

                    <div className="flex items-center gap-2 text-white/50 text-xs font-black uppercase tracking-widest mt-2">
                        <MapPin size={14} className="text-accent-primary" />
                        {match.stadium || match.homeTeam.stadium || 'Sede a definir'}
                    </div>

                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        {isReferee && (
                            <Link href={`/matches/${match.id}/referee`} className="bg-accent-primary text-black px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                <Shield size={16} />
                                Panel de Árbitro
                            </Link>
                        )}
                        {match.status !== 'FINISHED' && (
                            <button
                                onClick={() => setShowStreamModal(true)}
                                className={`${hasActiveStream ? 'bg-black text-accent-primary border border-accent-primary' : 'bg-red-600 text-white'} px-6 py-3 font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]`}
                            >
                                <Video size={16} />
                                {hasActiveStream ? 'Actualizar Transmisión' : 'Transmitir en Vivo'}
                            </button>
                        )}
                    </div>

                    {hasActiveStream && streamEmbedUrl && (
                        <div className="mt-8 w-full max-w-3xl aspect-video bg-black border-4 border-black shadow-2xl overflow-hidden relative group">
                            <iframe
                                className="w-full h-full"
                                src={streamEmbedUrl}
                                title="Stream Player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}

                    {hasActiveStream && !streamEmbedUrl && match.stream?.streamUrl && (
                        <div className="mt-8 p-6 bg-bg-secondary border-2 border-dashed border-accent-primary/30 text-center max-w-3xl w-full">
                            <p className="text-xs font-black uppercase text-accent-primary mb-2">Transmisión en curso</p>
                            <a
                                href={match.stream.streamUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-accent-primary text-black px-4 py-2 text-[10px] font-black uppercase hover:bg-white transition-all shadow-lg"
                            >
                                <Video size={14} /> Ver en Plataforma Externa
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <div className="main-container px-6 -mt-6 relative z-10 space-y-8">
                {/* Info Card */}
                <div className="bg-bg-card border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-text-secondary opacity-60">Información General</h2>
                            {isAdmin && match.status !== 'FINISHED' && (
                                <button
                                    onClick={() => isEditing ? handleUpdateMatch() : setIsEditing(true)}
                                    className={`h-10 w-10 flex items-center justify-center border-2 border-black transition-all ${isEditing ? 'bg-accent-primary text-white' : 'bg-bg-secondary hover:bg-black hover:text-white'}`}
                                >
                                    {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-bg-secondary border-2 border-border-subtle p-5 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-accent-primary font-black uppercase text-[10px] tracking-widest">
                                    <Calendar size={12} />
                                    <span>Fecha</span>
                                </div>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editedDate}
                                        onChange={(e) => setEditedDate(e.target.value)}
                                        className="w-full bg-bg-card border-2 border-black px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary"
                                    />
                                ) : (
                                    <p className="text-text-primary font-black text-lg">{new Date(match.matchDate).toLocaleDateString()}</p>
                                )}
                            </div>

                            <div className="bg-bg-secondary border-2 border-border-subtle p-5 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-accent-primary font-black uppercase text-[10px] tracking-widest">
                                    <Clock size={12} />
                                    <span>Horario</span>
                                </div>
                                {isEditing ? (
                                    <input
                                        type="time"
                                        value={editedTime}
                                        onChange={(e) => setEditedTime(e.target.value)}
                                        className="w-full bg-bg-card border-2 border-black px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary"
                                    />
                                ) : (
                                    <p className="text-text-primary font-black text-lg">{match.matchTime || '--:--'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referee Card */}
                <div className="bg-bg-card border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="p-8">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 mb-6">Autoridades</h2>

                        {(match.status === 'FINISHED' || match.status === 'LIVE' || match.referee || match.refereeAssignment?.referee) ? (
                            <div className="flex items-center justify-between bg-bg-secondary p-5 border-2 border-border-subtle">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-black flex items-center justify-center text-accent-primary border-b-4 border-accent-primary">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-accent-primary tracking-widest mb-0.5">Árbitro</p>
                                        <div className="font-black text-text-primary text-lg uppercase tracking-tight italic">
                                            {(match.referee || match.refereeAssignment?.referee)?.name} {(match.referee || match.refereeAssignment?.referee)?.lastName}
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && match.status !== 'FINISHED' && (
                                    <button
                                        onClick={() => {
                                            setConfirmAction({
                                                title: 'Remover Árbitro',
                                                message: '¿Estás seguro de quitar el árbitro de este partido?',
                                                action: () => setMatch({ ...match, referee: undefined, refereeAssignment: undefined } as any)
                                            });
                                            setShowConfirm(true);
                                        }}
                                        className="h-10 w-10 flex items-center justify-center bg-bg-card border-2 border-black text-text-secondary hover:text-red-600 hover:border-red-600 transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="bg-accent-secondary/20 border-2 border-accent-secondary p-5 flex items-center gap-3">
                                    <AlertCircle size={20} className="text-accent-secondary" />
                                    <p className="text-xs text-text-primary font-black uppercase tracking-wider">Árbitro por definir</p>
                                </div>

                                {isAdmin && (
                                    <div className="flex flex-col gap-3 pt-2">
                                        <Button onClick={handleRandomReferee} variant="secondary" size="lg" className="font-black uppercase tracking-widest text-xs">
                                            Selección Aleatoria
                                        </Button>
                                        <div className="relative">
                                            <select
                                                onChange={(e) => handleManualReferee(e.target.value)}
                                                className="w-full bg-bg-secondary border-2 border-black px-6 py-4 text-xs text-text-primary uppercase font-black tracking-widest appearance-none outline-none focus:border-accent-primary transition-all"
                                                value=""
                                            >
                                                <option value="" disabled>Seleccionar Manualmente...</option>
                                                {availableReferees.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name} {r.lastName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <MatchLineupsSection match={match} user={user} onLineupSaved={fetchMatch} />

                {/* Events Timeline Card */}
                <div className="bg-bg-card border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="p-8">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 mb-6">Minuto a Minuto</h2>

                        {match.events && match.events.length > 0 ? (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-border-subtle before:to-transparent mb-8">
                                {match.events.map((event: any, i: number) => {
                                    const isHome = event.teamSide === 'home';
                                    const eventIcons: Record<string, string> = {
                                        GOAL: '⚽',
                                        YELLOW_CARD: '🟨',
                                        RED_CARD: '🟥',
                                        SUBSTITUTION: '🔄',
                                        FOUL: '❌',
                                        WARNING: '💬',
                                        MATCH_START: '▶️',
                                        MATCH_END: '⏹️',
                                        HALFTIME_START: '⏸️',
                                        HALFTIME_END: '▶️'
                                    };

                                    return (
                                        <div key={event.id || i} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-black bg-bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-lg">
                                                {eventIcons[event.type] || '📌'}
                                            </div>
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-bg-secondary p-4 border-2 border-border-subtle group-hover:border-accent-primary transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-black text-accent-primary text-xs tracking-widest uppercase">
                                                        {event.minute ? `${event.minute}'` : 'Evento'}
                                                    </span>
                                                    {event.teamSide ? (
                                                        <span className="text-[10px] font-black uppercase text-text-secondary bg-black/5 px-2 py-0.5">
                                                            {isHome ? match.homeTeam.nameShort || match.homeTeam.name : match.awayTeam.nameShort || match.awayTeam.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase text-text-secondary bg-black/5 px-2 py-0.5">
                                                            {event.player ? `${event.player.name} ${event.player.lastName}` : 'Invitado'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm font-black text-text-primary uppercase tracking-tight">
                                                    {MATCH_EVENT_LABELS[event.type] || event.type}
                                                </div>
                                                {event.details && (
                                                    <p className="text-xs text-text-secondary mt-2 italic border-l-2 border-accent-primary pl-2">"{event.details}"</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border-subtle bg-bg-secondary/50 mb-8">
                                <Clock size={32} className="text-text-secondary/30 mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Sin eventos todavía</p>
                                <p className="text-xs text-text-secondary/60 mt-2">Los incidentes del partido aparecerán aquí</p>
                            </div>
                        )}

                        {/* Leave a comment section */}
                        <div className="bg-bg-secondary border-2 border-border-subtle p-4 flex gap-3">
                            <Input
                                placeholder={user ? "Escribe un comentario..." : "Escribe un comentario (Invitado)..."}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                className="flex-1"
                                onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                            />
                            <Button
                                onClick={handlePostComment}
                                isLoading={isSubmittingComment}
                                disabled={!newComment.trim()}
                                className="uppercase font-black tracking-widest text-[10px]"
                            >
                                Enviar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmAction?.action || (() => { })}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
            />

            <Modal isOpen={showStreamModal} onClose={() => setShowStreamModal(false)} title="Ser Transmisor en Vivo">
                <form onSubmit={handleStartStream} className="space-y-4">
                    <p className="text-xs text-text-secondary">Pega el link de YouTube, Twitch o Facebook Live para ofrecer tu transmisión a todos los que sigan el partido.</p>
                    <Input
                        required
                        placeholder="https://..."
                        value={streamUrl}
                        onChange={e => setStreamUrl(e.target.value)}
                    />
                    <Button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white border-2 border-black">
                        <Video size={18} /> Iniciar Transmisión
                    </Button>
                </form>
            </Modal>
        </div>
    );
}

function TeamHeaderDisplay({ team }: { team: any }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 max-sm:h-16 max-sm:w-16 border-4 border-white/20 bg-white/5 shadow-2xl flex items-center justify-center overflow-hidden -rotate-3 hover:rotate-0 transition-transform duration-500">
                {team.logo ? (
                    <img src={team.logo} className="h-full w-full object-cover" />
                ) : (
                    <Shield size={48} className="text-white/20" />
                )}
            </div>
            <span className="text-sm font-black text-white uppercase tracking-tighter text-center max-w-[120px] leading-tight italic">
                {team.name}
            </span>
        </div>
    );
}
