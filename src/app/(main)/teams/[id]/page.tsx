'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { api } from '@/adapters/http';
import {
    Shield,
    UserPlus,
    MapPin,
    Calendar,
    Trophy,
    ChevronLeft,
    Settings,
    User,
    MessageSquare,
    Image as ImageIcon,
    Plus,
    History,
    Target,
    Eye,
    EyeOff,
    Loader2,
    Clock,
    Phone,
    Mail,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PublicationCard } from '@/components/features/social/PublicationCard';
import { CreateTeamForm } from '@/components/features/management/CreateTeamForm';
import { CreateUserForm } from '@/components/features/management/CreateUserForm';

import { usePersistentData } from '@/hooks/usePersistentData';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

interface Player {
    id: string;
    name: string;
    lastName: string;
    image: string | null;
    phone?: string;
    dni?: string;
    birthdate?: string;
    publicFields?: string[];
    role?: string;
}

interface TeamMembership {
    id: string;
    number: number | null;
    position: string | null;
    isActive: boolean;
    joinedAt: string;
    leftAt: string | null;
    player: Player & { playerStatus?: string };
}

interface Team {
    id: string;
    name: string;
    nameShort: string | null;
    description: string | null;
    logo: string | null;
    city: string;
    state: string;
    stadium: string | null;
    phone: string | null;
    email: string | null;
    presidentId: string | null;
    coachId: string | null;
    category?: string | null;
    division?: string | null;
    possibleSignings: string[];
    president?: { id: string, name: string, lastName: string, image?: string };
    coach?: { id: string, name: string, lastName: string, image?: string };
    players: TeamMembership[];
    homeMatches?: any[];
    awayMatches?: any[];
}

export default function TeamDetailPage() {
    const params = useParams();
    const teamId = params['id'] as string;
    const router = useRouter();
    const { user } = useAuth();
    const { success, error: showError } = useAlert();

    const userRole = user?.role?.trim().toUpperCase();
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

    const { data: team, loading, refresh: fetchTeam } = usePersistentData<Team>(
        `team_detail_v3_${teamId}`,
        async () => {
            const res = await api.get(`/teams/${teamId}?t=${Date.now()}`);
            return res.data.data;
        },
        [teamId, user?.id]
    );


    const [activeTab, setActiveTab] = useState<'roster' | 'matches' | 'publications' | 'history' | 'signings'>('roster');
    const [activeModal, setActiveModal] = useState<'assignPlayer' | 'assignCoach' | 'createPublication' | 'manageSignings' | 'editTeam' | null>(null);

    const { data: publicationsRaw, loading: publicationsLoading, refresh: fetchPublications } = usePersistentData<any[]>(
        `team_publications_${teamId}`,
        async () => {
            if (activeTab !== 'publications') return [];
            const res = await api.get(`/publications?teamId=${teamId}`);
            return res.data.data;
        },
        [teamId, activeTab]
    );
    const publications = publicationsRaw || [];

    // Forms state
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [selectedPlayerName, setSelectedPlayerName] = useState('');
    const [playerNumber, setPlayerNumber] = useState('');
    const [playerPosition, setPlayerPosition] = useState('');
    const [assignRole, setAssignRole] = useState<'PLAYER' | 'STAFF'>('PLAYER');
    const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await api.get(`/users?search=${encodeURIComponent(searchQuery)}&pageSize=5&unassigned=true`);
                setSearchResults(res.data.data);
            } catch (err) { }
            finally { setIsSearching(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: availablePlayersRaw } = usePersistentData<Player[]>(
        'available_players',
        async () => {
            if (!(user?.role === 'PRESIDENT' || isAdmin)) return [];
            const res = await api.get('/users?role=PLAYER&pageSize=200');
            return res.data.data;
        },
        [user?.role, isAdmin]
    );
    const availablePlayers = availablePlayersRaw || [];

    const { data: availableCoachesRaw } = usePersistentData<Player[]>(
        'available_coaches',
        async () => {
            if (!(user?.role === 'PRESIDENT' || isAdmin)) return [];
            const res = await api.get('/users?role=COACH&pageSize=200');
            return res.data.data;
        },
        [user?.role, isAdmin]
    );
    const availableCoaches = availableCoachesRaw || [];

    // Publication state
    const [publicationContent, setPublicationContent] = useState('');

    const handleAssignPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/teams/${teamId}/players`, {
                playerId: selectedPlayerId,
                number: playerNumber ? parseInt(playerNumber) : undefined,
                position: playerPosition || undefined,
                role: assignRole
            });
            setActiveModal(null);
            setSelectedPlayerId('');
            setSelectedPlayerName('');
            setSearchQuery('');
            setAssignRole('PLAYER');
            setPlayerNumber('');
            setPlayerPosition('');
            setIsCreatingPlayer(false);
            fetchTeam();
            success('Miembro asignado correctamente');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al asignar miembro');
        }
    };

    const handleRemovePlayer = async (playerId: string) => {
        if (!confirm('¿Estás seguro de quitar a este jugador del equipo?')) return;
        try {
            await api.delete(`/teams/${teamId}/players/${playerId}`);
            fetchTeam();
            success('Jugador quitado del equipo');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al quitar jugador');
        }
    };

    const handleUpdatePlayerStatus = async (playerId: string, newStatus: string) => {
        try {
            await api.patch(`/users/${playerId}`, { playerStatus: newStatus });
            fetchTeam();
            success('Estado del jugador actualizado');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al actualizar el estado');
        }
    };

    const handleCreatePublication = async () => {
        if (!publicationContent.trim()) return;
        try {
            await api.post('/publications', {
                teamId,
                content: publicationContent
            });
            setPublicationContent('');
            fetchPublications();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al crear publicación');
        }
    };

    const canManage = Boolean(isAdmin || (user?.id && team?.presidentId && user.id === team.presidentId));
    const canManageSports = Boolean(canManage || (user?.id && team?.coachId && user.id === team.coachId));

    const currentPlayers = team?.players?.filter(p => p?.isActive) || [];
    const pastPlayers = team?.players?.filter(p => !p?.isActive) || [];

    const renderPlayerField = (p: Player, field: 'phone' | 'dni' | 'birthdate', label: string) => {
        if (!p) return null;
        const isPublic = p.publicFields?.includes(field);
        const isPrivileged = isAdmin || user?.id === team?.presidentId || user?.id === team?.coachId || user?.role === 'REFEREE';

        if (!p[field as keyof Player]) return null;

        if (isPublic || isPrivileged) {
            return (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-text-secondary">
                    <span className="font-bold uppercase tracking-tighter opacity-70">{label}:</span>
                    <span>{p[field as keyof Player] as string}</span>
                    {isPrivileged && !isPublic && <Eye size={10} className="text-accent-primary opacity-50 ml-1" />}
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary">
            <div className="h-6 w-6 border-2 border-accent-primary border-t-transparent animate-spin mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Cargando equipo...</p>
        </div>
    );

    if (!team) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary p-6 text-center">
            <Shield size={48} className="text-border-subtle mb-4" />
            <p className="text-text-primary font-black uppercase italic tracking-tighter">Equipo no encontrado</p>
            <button onClick={() => router.push('/teams')} className="mt-4 text-xs text-accent-primary font-bold uppercase underline">Volver a equipos</button>
        </div>
    );

    return (
        <div className="min-h-screen pb-32 bg-bg-primary mesh-bg">
            {/* Floating Action Button for Admins */}
            {canManage && (
                <button
                    onClick={() => setActiveModal('editTeam')}
                    className="fixed bottom-10 right-10 h-20 w-20 bg-accent-primary text-white rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center z-[100] hover:scale-110 active:scale-95 transition-all group"
                >
                    <Settings size={22} className="group-hover:rotate-90 transition-transform" />
                    <span className="text-[12px] font-white uppercase tracking-tighter">Editar</span>
                </button>
            )}

            {/* Header Profile */}
            <div className="relative h-56 bg-black border-b-8 border-accent-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

                <button
                    onClick={() => router.back()}
                    className="absolute left-6 top-6 h-12 w-12 flex items-center justify-center bg-white/10 text-white border-2 border-white/20 hover:bg-white hover:text-black transition-all z-20"
                >
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>

                {canManage && (
                    <button
                        onClick={() => setActiveModal('editTeam')}
                        className="absolute right-6 top-6 h-12 w-12 flex items-center justify-center bg-white/10 text-white border-2 border-white/20 hover:bg-white hover:text-black transition-all z-20"
                    >
                        <Settings size={20} strokeWidth={3} />
                    </button>
                )}
            </div>

            <div className="main-container px-6 -mt-20 relative z-10">
                <div className="flex items-end gap-6 mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="h-36 w-36 shrink-0 bg-black border-8 border-bg-primary shadow-2xl flex items-center justify-center overflow-hidden -rotate-3 hover:rotate-0 transition-transform"
                    >
                        {team.logo ? (
                            <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                        ) : (
                            <Shield size={48} className="text-accent-primary" />
                        )}
                    </motion.div>
                    <div className="pb-2">
                        <h1 className="text-5xl font-black text-text-primary italic uppercase tracking-tighter leading-none">{team.name}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1">
                                <MapPin size={12} className="text-accent-primary" /> {team.city}, {team.state}
                            </p>
                            <FavoriteButton teamId={teamId} />
                            {canManage && (
                                <button
                                    onClick={() => setActiveModal('editTeam')}
                                    className="xl:hidden px-3 py-1 bg-accent-primary text-black text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all border border-black transform -skew-x-12"
                                >
                                    Editar Equipo
                                </button>
                            )}
                        </div>
                        {(team.category || team.division) && (
                            <div className="flex gap-2 mt-2 text-[10px] font-black text-text-primary uppercase tracking-widest">
                                {team.category && <span className="bg-bg-secondary px-2 py-1 border border-border-subtle">Cat: {team.category}</span>}
                                {team.division && <span className="bg-bg-secondary px-2 py-1 border border-border-subtle">Div: {team.division}</span>}
                            </div>
                        )}
                    </div>
                </div>

                {team.description && (
                    <p className="text-sm text-text-secondary mb-8 max-w-2xl">{team.description}</p>
                )}

                {/* Roles/Staff */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-bg-card border-2 border-black p-5">
                        <span className="text-[10px] font-black uppercase text-accent-primary tracking-widest block mb-1">Presidente</span>
                        <p className="text-sm font-black text-text-primary uppercase truncate italic">
                            {team.president ? `${team.president.name} ${team.president.lastName}` : 'Sin asignar'}
                        </p>
                    </div>
                    <div className="bg-bg-card border-2 border-black p-5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase text-accent-primary tracking-widest block mb-1">Director Técnico</span>
                            <p className="text-sm font-black text-text-primary uppercase truncate italic">
                                {team.coach ? `${team.coach.name} ${team.coach.lastName}` : 'Sin asignar'}
                            </p>
                        </div>
                        {canManage && (
                            <button onClick={() => setActiveModal('assignCoach')} className="p-2 hover:bg-bg-secondary text-text-secondary transition-all border border-border-subtle">
                                <UserPlus size={16} />
                            </button>
                        )}
                    </div>
                </div>                {/* Stadium & Contact */}
                {(team.stadium || team.phone || team.email) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        {team.stadium && (
                            <div className="bg-bg-card border-2 border-black p-5 flex items-center gap-4">
                                <Building2 size={24} className="text-accent-primary shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest block mb-1">Estadio / Sede</span>
                                    <p className="text-sm font-black text-text-primary uppercase italic truncate">{team.stadium}</p>
                                </div>
                            </div>
                        )}
                        {team.phone && (
                            <div className="bg-bg-card border-2 border-black p-5 flex items-center gap-4">
                                <Phone size={24} className="text-accent-primary shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest block mb-1">Teléfono</span>
                                    <p className="text-sm font-black text-text-primary uppercase italic truncate">{team.phone}</p>
                                </div>
                            </div>
                        )}
                        {team.email && (
                            <div className="bg-bg-card border-2 border-black p-5 flex items-center gap-4">
                                <Mail size={24} className="text-accent-primary shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest block mb-1">Email</span>
                                    <p className="text-sm font-black text-text-primary uppercase italic truncate">{team.email}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 border-b-4 border-black pb-2 mb-8 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'roster', label: 'Plantel', icon: <User size={16} /> },
                        { id: 'matches', label: 'Partidos', icon: <Calendar size={16} /> },
                        { id: 'publications', label: 'Muro', icon: <MessageSquare size={16} /> },
                        { id: 'history', label: 'Historial', icon: <History size={16} /> },
                        { id: 'signings', label: 'Fichajes', icon: <Target size={16} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 border-black shrink-0 ${activeTab === tab.id ? 'bg-black text-white shadow-[4px_4px_0px_0px_var(--accent-primary)] -translate-y-1' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'roster' && (
                        <motion.div key="roster" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">Jugadores Actuales</h2>
                                {canManageSports && (
                                    <button onClick={() => setActiveModal('assignPlayer')} className="px-6 py-3 bg-accent-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 border-2 border-black">
                                        <UserPlus size={14} /> Añadir
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-3">
                                {(() => {
                                    const actualPlayers = currentPlayers.filter(m => !m.player.role || m.player.role === 'PLAYER' || m.player.role === 'USER');
                                    const staffMembers = currentPlayers.filter(m => m.player.role === 'STAFF' || m.player.role === 'COACH' || m.player.role === 'PRESIDENT');

                                    const renderMember = (m: any) => (
                                        <div key={m.id} className="group bg-bg-card border-2 border-black p-5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-between">
                                            <Link href={`/players/${m.player.id}`} className="flex items-center gap-4 flex-1">
                                                <div className="h-14 w-14 bg-black border-2 border-black flex items-center justify-center overflow-hidden shrink-0">
                                                    {m.player?.image ? <img src={m.player.image} alt="" className="object-cover h-full w-full" /> : <User size={20} className="text-white/20" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-text-primary uppercase group-hover:text-accent-primary transition-colors italic">{m.player?.name} {m.player?.lastName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black px-2 py-0.5 bg-accent-primary text-white uppercase">{m.position || 'Gral'}</span>
                                                        {m.number && <span className="text-[10px] font-bold text-text-secondary">#{m.number}</span>}
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="flex flex-col items-end gap-2 text-right">
                                                {canManageSports ? (
                                                    <>
                                                        <select
                                                            value={m.player.playerStatus || 'ACTIVE'}
                                                            onChange={(e) => handleUpdatePlayerStatus(m.player.id, e.target.value)}
                                                            className={`text-[9px] font-black uppercase px-2 py-1 outline-none cursor-pointer border-2 border-transparent hover:border-black transition-all ${m.player.playerStatus === 'INJURED' ? 'bg-red-600 text-white' :
                                                                    m.player.playerStatus === 'INACTIVE' ? 'bg-bg-secondary text-text-secondary' :
                                                                        'bg-green-500 text-black'
                                                                }`}
                                                        >
                                                            <option value="ACTIVE" className="bg-white text-black">ACTIVO</option>
                                                            <option value="INJURED" className="bg-white text-black">LESIONADO</option>
                                                            <option value="RESTING" className="bg-white text-black">DESCANSO</option>
                                                            <option value="INACTIVE" className="bg-white text-black">INACTIVO</option>
                                                        </select>
                                                        <button onClick={() => handleRemovePlayer(m.player.id)} className="p-2 text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600/10 border border-transparent hover:border-red-600" title="Quitar del equipo">
                                                            <Plus size={18} className="rotate-45" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 ${m.player.playerStatus === 'INJURED' ? 'bg-red-600 text-white' :
                                                            m.player.playerStatus === 'INACTIVE' ? 'bg-bg-secondary text-text-secondary' :
                                                                'bg-green-500 text-black'
                                                        }`}>
                                                        {m.player.playerStatus === 'INJURED' ? 'LESIONADO' :
                                                            m.player.playerStatus === 'INACTIVE' ? 'INACTIVO' :
                                                                m.player.playerStatus === 'RESTING' ? 'DESCANSO' : 'ACTIVO'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <>
                                            {actualPlayers.length > 0 && (
                                                <div className="space-y-3">
                                                    {actualPlayers.map(renderMember)}
                                                </div>
                                            )}
                                            {staffMembers.length > 0 && (
                                                <div className="space-y-3 mt-8">
                                                    <h3 className="text-lg font-black text-accent-primary italic uppercase tracking-tighter border-t-2 border-black pt-6">Cuerpo Técnico / Staff</h3>
                                                    {staffMembers.map(renderMember)}
                                                </div>
                                            )}
                                            {currentPlayers.length === 0 && (
                                                <div className="py-20 text-center border-4 border-dashed border-black/10">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No hay miembros activos en el plantel</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'matches' && (
                        <motion.div key="matches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">Calendario y Resultados</h2>
                            <div className="grid gap-4">
                                {(() => {
                                    const allMatches = [...(team.homeMatches || []), ...(team.awayMatches || [])]
                                        .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

                                    if (allMatches.length === 0) {
                                        return <div className="py-20 text-center border-4 border-dashed border-black/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No hay partidos registrados</p>
                                        </div>;
                                    }

                                    return allMatches.map((m: any) => {
                                        const isHome = m.homeTeam?.id === team.id || m.homeTeamId === team.id;
                                        const opponent = isHome ? m.awayTeam : m.homeTeam;

                                        return (
                                            <Link href={`/matches/${m.id}`} key={m.id} className="bg-bg-card border-2 border-black p-5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex items-center justify-between group">
                                                <div className="flex-1">
                                                    <span className="text-[9px] font-black text-accent-primary uppercase tracking-widest block mb-1">{m.tournament?.name} • {new Date(m.matchDate).toLocaleDateString()}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-lg font-black uppercase italic ${isHome ? 'text-text-primary' : 'text-text-secondary'}`}>{team.nameShort || team.name}</span>
                                                        <div className="bg-bg-secondary border-2 border-border-subtle px-3 py-1 text-sm font-black tabular-nums tracking-widest">
                                                            {m.status === 'FINISHED' ? `${isHome ? m.homeGoals : m.awayGoals} - ${isHome ? m.awayGoals : m.homeGoals}` : 'VS'}
                                                        </div>
                                                        <span className={`text-lg font-black uppercase italic ${!isHome ? 'text-text-primary' : 'text-text-secondary'}`}>{opponent?.nameShort || opponent?.name || '???'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex h-10 w-10 items-center justify-center bg-black text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all">
                                                    <Calendar size={18} />
                                                </div>
                                            </Link>
                                        );
                                    });
                                })()}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'publications' && (
                        <motion.div key="publications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            {canManage && (
                                <div className="bg-bg-card border-2 border-black p-6 space-y-4">
                                    <h3 className="text-sm font-black text-text-primary italic uppercase tracking-tighter">Nueva Publicación</h3>
                                    <textarea
                                        value={publicationContent}
                                        onChange={(e) => setPublicationContent(e.target.value)}
                                        placeholder="¿Qué está pasando en el equipo?"
                                        className="w-full bg-bg-secondary border-2 border-border-subtle p-4 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all resize-none h-24"
                                    />
                                    <div className="flex justify-end">
                                        <Button onClick={handleCreatePublication} disabled={!publicationContent.trim()} size="sm">Publicar</Button>
                                    </div>
                                </div>
                            )}
                            {publicationsLoading ? (
                                <div className="text-center py-10 text-text-secondary">Cargando publicaciones...</div>
                            ) : (
                                <div className="space-y-4">
                                    {publications.map((pub) => (
                                        <PublicationCard key={pub.id} publication={pub} onUpdate={fetchPublications} />
                                    ))}
                                    {publications.length === 0 && <p className="text-center py-20 text-[10px] font-black uppercase tracking-widest opacity-30 italic border-4 border-dashed border-black/10">No hay publicaciones</p>}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">Jugadores Históricos</h2>
                            <div className="grid gap-3">
                                {pastPlayers.length === 0 ? (
                                    <div className="py-20 text-center border-4 border-dashed border-black/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No hay registros de jugadores anteriores</p>
                                    </div>
                                ) : (
                                    pastPlayers.map((m) => (
                                        <div key={m.id} className="bg-bg-card border-2 border-black p-5 flex items-center gap-4 opacity-60">
                                            <div className="h-12 w-12 bg-bg-secondary border-2 border-border-subtle flex items-center justify-center grayscale">
                                                {m.player?.image ? <img src={m.player.image} alt="" className="object-cover h-full w-full" /> : <User size={16} className="text-text-secondary" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-text-primary uppercase italic">{m.player?.name} {m.player?.lastName}</p>
                                                <p className="text-[10px] text-text-secondary font-bold uppercase">Desde {new Date(m.joinedAt).toLocaleDateString()} hasta {m.leftAt ? new Date(m.leftAt).toLocaleDateString() : '?'}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'signings' && (
                        <motion.div key="signings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">Posibles Fichajes</h2>
                                {canManage && (
                                    <button onClick={() => setActiveModal('manageSignings')} className="px-4 py-2 bg-bg-card border-2 border-black text-[10px] font-black uppercase text-text-secondary hover:bg-black hover:text-white transition-all">
                                        Gestionar
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-text-secondary italic">Lista de jugadores que el equipo está siguiendo para la próxima temporada.</p>
                            <div className="grid gap-2">
                                {team.possibleSignings?.length === 0 ? (
                                    <p className="text-center py-20 text-[10px] font-black uppercase tracking-widest opacity-30 italic border-4 border-dashed border-black/10">No hay fichajes en seguimiento</p>
                                ) : (
                                    team.possibleSignings?.map((name, i) => (
                                        <div key={i} className="bg-bg-card border-2 border-black border-l-8 border-l-accent-primary p-4 text-sm font-black text-accent-primary uppercase tracking-tight flex items-center gap-2 italic">
                                            <Target size={14} className="opacity-50" /> {name}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Modal
                isOpen={activeModal === 'assignPlayer'}
                onClose={() => { setActiveModal(null); setIsCreatingPlayer(false); }}
                title={isCreatingPlayer ? "Inscribir Nuevo Miembro" : "Añadir Miembro al Plantel"}
            >
                {isCreatingPlayer ? (
                    <CreateUserForm
                        role={assignRole}
                        onSuccess={() => {
                            setIsCreatingPlayer(false);
                            setActiveModal(null);
                            fetchTeam();
                            success('Miembro creado y asignado exitosamente');
                        }}
                        onCancel={() => setIsCreatingPlayer(false)}
                    />
                ) : (
                    <form onSubmit={handleAssignPlayer} className="space-y-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-text-secondary ml-1 tracking-widest">Buscar Usuario (Nombre, DNI o Correo)</label>

                            {selectedPlayerId ? (
                                <div className="p-3 bg-accent-primary/10 border-2 border-accent-primary flex justify-between items-center">
                                    <span className="font-bold text-sm">{selectedPlayerName}</span>
                                    <button type="button" onClick={() => { setSelectedPlayerId(''); setSelectedPlayerName(''); }} className="text-xs font-black uppercase text-red-500 underline">Cambiar</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Input
                                        placeholder="Escribe para buscar..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                    {isSearching && <div className="absolute right-3 top-3"><Loader2 size={16} className="animate-spin text-accent-primary" /></div>}

                                    {searchQuery && !isSearching && searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-bg-card border-2 border-black max-h-48 overflow-y-auto shadow-xl">
                                            {searchResults.map(res => (
                                                <div
                                                    key={res.id}
                                                    onClick={() => { setSelectedPlayerId(res.id); setSelectedPlayerName(`${res.name} ${res.lastName}`); }}
                                                    className="p-3 border-b border-border-subtle hover:bg-bg-secondary cursor-pointer flex flex-col"
                                                >
                                                    <span className="font-bold text-sm block">{res.name} {res.lastName}</span>
                                                    <span className="text-xs text-text-secondary">{res.email} {res.dni ? `| DNI: ${res.dni}` : ''}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchQuery && !isSearching && searchResults.length === 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-bg-card border-2 border-black p-4 shadow-xl text-center text-sm text-text-secondary">
                                            No se encontraron usuarios
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1 mt-4">
                            <label className="text-[10px] font-black uppercase text-text-secondary ml-1 tracking-widest">Rol en el Equipo</label>
                            <select
                                value={assignRole}
                                onChange={(e) => setAssignRole(e.target.value as any)}
                                className="w-full bg-bg-secondary border-2 border-black px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary appearance-none uppercase font-black tracking-wider"
                                required
                            >
                                <option value="PLAYER">Jugador de Campo</option>
                                <option value="STAFF">Cuerpo Técnico / Staff</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label={assignRole === 'PLAYER' ? "Número de Camiseta (Opcional)" : "Número (Opcional)"} type="number" value={playerNumber} onChange={(e) => setPlayerNumber(e.target.value)} />
                            <Input label="Posición / Cargo" placeholder={assignRole === 'PLAYER' ? "Ej: Delantero" : "Ej: Ayudante"} value={playerPosition} onChange={(e) => setPlayerPosition(e.target.value)} />
                        </div>
                        <Button type="submit" disabled={!selectedPlayerId} className="w-full">Asignar al Equipo</Button>

                        <div className="pt-4 border-t-2 border-border-subtle mt-4">
                            <p className="text-[10px] text-text-secondary text-center uppercase font-bold mb-2">¿La persona no está registrada?</p>
                            <button
                                type="button"
                                onClick={() => setIsCreatingPlayer(true)}
                                className="w-full py-3 border-2 border-dashed border-accent-primary text-accent-primary text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary/5 transition-all"
                            >
                                Inscribir Nuevo Usuario
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                isOpen={activeModal === 'assignCoach'}
                onClose={() => setActiveModal(null)}
                title="Asignar Director Técnico"
            >
                <div className="space-y-4">
                    {availableCoaches.map(c => (
                        <button
                            key={c.id}
                            onClick={async () => {
                                try {
                                    await api.put(`/teams/${teamId}`, { coachId: c.id });
                                    fetchTeam();
                                    setActiveModal(null);
                                } catch (err) { showError('Error al asignar coach'); }
                            }}
                            className="w-full p-4 bg-bg-secondary border-2 border-black flex items-center justify-between hover:bg-accent-primary group transition-all"
                        >
                            <span className="font-bold text-text-primary group-hover:text-white uppercase">{c.name} {c.lastName}</span>
                            <Plus size={18} className="text-accent-primary group-hover:text-white" />
                        </button>
                    ))}
                    {availableCoaches.length === 0 && <p className="text-center text-text-secondary text-xs py-10">No hay técnicos disponibles para asignar.</p>}
                </div>
            </Modal>

            <Modal
                isOpen={activeModal === 'manageSignings'}
                onClose={() => setActiveModal(null)}
                title="Gestionar Fichajes Seguimiento"
            >
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            id="new-signing"
                            type="text"
                            placeholder="Nombre del jugador..."
                            className="flex-1 bg-bg-secondary border-2 border-black px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                        />
                        <Button size="sm" onClick={async () => {
                            const input = document.getElementById('new-signing') as HTMLInputElement;
                            if (!input.value) return;
                            const newList = [...(team.possibleSignings || []), input.value];
                            try {
                                await api.put(`/teams/${teamId}`, { possibleSignings: newList });
                                fetchTeam();
                                input.value = '';
                            } catch (err) { showError('Error actualizando fichajes'); }
                        }}>Añadir</Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {team.possibleSignings?.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-bg-secondary border-2 border-border-subtle">
                                <span className="text-sm text-text-primary font-bold uppercase">{s}</span>
                                <button
                                    onClick={async () => {
                                        const newList = team.possibleSignings.filter((_, idx) => idx !== i);
                                        await api.put(`/teams/${teamId}`, { possibleSignings: newList });
                                        fetchTeam();
                                    }}
                                    className="text-red-600 hover:bg-red-600/10 p-1 transition-all"
                                >
                                    <Plus size={16} className="rotate-45" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={activeModal === 'editTeam'}
                onClose={() => setActiveModal(null)}
                title="Editar Equipo"
            >
                <CreateTeamForm
                    initialData={team}
                    onSuccess={() => {
                        setActiveModal(null);
                        fetchTeam();
                        success('Equipo actualizado');
                    }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>
        </div>
    );
}
