'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { api } from '@/adapters/http';
import { Trophy, ChevronLeft, MapPin, CalendarDays, Users, Check, X, Shield, MessageSquare, Plus, Award, Search, CheckCircle2, Edit2, Settings, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { PublicationCard } from '@/components/features/social/PublicationCard';
import { TournamentBracket } from '@/components/features/tournaments/TournamentBracket';
import { AnimatedFixture } from '@/components/features/tournaments/AnimatedFixture';
import { StartTournamentModal } from '@/components/features/tournaments/StartTournamentModal';
import { EditMatchModal } from '@/components/features/tournaments/EditMatchModal';
import { CreateTournamentForm } from '@/components/features/management/CreateTournamentForm';
import { usePersistentData } from '@/hooks/usePersistentData';

interface Tournament {
    id: string;
    name: string;
    description: string | null;
    dateStart: string;
    dateEnd: string | null;
    city: string | null;
    state: string | null;
    category: string | null;
    division: string | null;
    type: 'LEAGUE' | 'ELIMINATION' | 'GROUPS_ELIMINATION';
    status: 'DRAFT' | 'REGISTRATION' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
    teams: any[];
    standings: any[];
    matches: any[];
}

export default function TournamentDetailPage() {
    const params = useParams();
    const tournamentId = params['id'] as string;
    const router = useRouter();
    const { user } = useAuth();
    const { success, error: showError } = useAlert();

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const isPresident = user?.role === 'PRESIDENT' || isAdmin;

    const { data: tournament, loading, refresh: fetchTournament } = usePersistentData<Tournament>(
        `tournament_detail_v3_${tournamentId}`,
        async () => {
            const res = await api.get(`/tournaments/${tournamentId}?t=${Date.now()}`);
            return res.data.data;
        },
        [tournamentId]
    );

    const { data: myTeamsRaw } = usePersistentData<any[]>(
        'my_teams',
        async () => {
            if (!isPresident) return [];
            const res = await api.get('/teams?pageSize=100');
            return isAdmin ? res.data.data : res.data.data.filter((t: any) => t.president?.id === user?.id);
        },
        [isPresident, isAdmin, user?.id]
    );
    const myTeams = myTeamsRaw || [];

    const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'inscriptions' | 'publications' | 'bracket'>('standings');
    const [activeModal, setActiveModal] = useState<'inscribe' | 'createMatch' | 'createPublication' | 'startTournament' | 'editMatch' | 'editTournament' | null>(null);
    const [generatingBracket, setGeneratingBracket] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);

    const { data: publicationsRaw, loading: pubsLoading, refresh: fetchPublications } = usePersistentData<any[]>(
        `tournament_publications_${tournamentId}`,
        async () => {
            if (activeTab !== 'publications') return [];
            const { data } = await api.get(`/publications?tournamentId=${tournamentId}`);
            return data.data;
        },
        [tournamentId, activeTab]
    );
    const publications = publicationsRaw || [];

    const [newPubContent, setNewPubContent] = useState('');

    const [standingsSearch, setStandingsSearch] = useState('');
    const [matchesSearch, setMatchesSearch] = useState('');
    const [matchesViewMode, setMatchesViewMode] = useState<'list' | 'fixture'>('list');
    const [inscriptionsSearch, setInscriptionsSearch] = useState('');
    const [publicationsSearch, setPublicationsSearch] = useState('');

    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [searchTeamQuery, setSearchTeamQuery] = useState('');
    const [filterDivision, setFilterDivision] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');

    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamId, setAwayTeamId] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [matchTime, setMatchTime] = useState('');
    const [stadium, setStadium] = useState('');
    const [matchDay, setMatchDay] = useState('');

    useEffect(() => {
        if (tournament) {
            setFilterCategory(tournament.category || '');
            setFilterDivision(tournament.division || '');
            setFilterState(tournament.state || '');
        }
    }, [tournament]);

    const teamsInfo = tournament?.teams.reduce((acc: any, t: any) => {
        acc[t.teamId] = {
            groupName: t.groupName,
            stadium: t.team?.stadium
        };
        return acc;
    }, {}) || {};

    const processedMatches = tournament?.matches.map((m: any) => ({
        ...m,
        groupName: m.groupName || teamsInfo[m.homeTeam?.id]?.groupName,
        stadium: m.stadium || m.homeTeam?.stadium || teamsInfo[m.homeTeam?.id]?.stadium || 'Sede a definir'
    })) || [];
    console.log(processedMatches)


    const handleCreateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (homeTeamId === awayTeamId) return showError('El equipo local y visitante no pueden ser el mismo');
        if (!matchDate) return showError('La fecha es obligatoria');
        try {
            const isoDate = new Date(matchDate).toISOString();
            await api.post('/matches', { tournamentId: tournament!.id, homeTeamId, awayTeamId, matchDate: isoDate, matchTime: matchTime || undefined, stadium: stadium || undefined, matchDay: matchDay ? parseInt(matchDay) : undefined });
            setActiveModal(null);
            fetchTournament();
            success('Partido creado exitosamente');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al crear el partido');
        }
    };

    const handleCreatePublication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPubContent.trim()) return;
        try {
            await api.post('/publications', { tournamentId, content: newPubContent });
            setNewPubContent('');
            setActiveModal(null);
            fetchPublications();
        } catch (err) {
            showError('Error al crear publicación');
        }
    };

    const handleInscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTeamIds.length === 0) return;
        try {
            await Promise.all(selectedTeamIds.map(teamId => api.post(`/tournaments/${tournament!.id}/teams`, { teamId })));
            setActiveModal(null);
            setSelectedTeamIds([]);
            fetchTournament();
            success(`Inscripción de ${selectedTeamIds.length} equipo(s) enviada de forma exitosa y pendiente de aprobación.`);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al inscribir equipos');
        }
    };

    const handleAcceptAllPending = async () => {
        const pending = tournament!.teams.filter(t => t.status === 'PENDING');
        if (pending.length === 0) return;
        if (!confirm(`¿Deseas aceptar los ${pending.length} equipos pendientes de una vez?`)) return;
        try {
            await Promise.all(pending.map(t => api.patch(`/tournaments/${tournament!.id}/teams/${t.team.id}`, { status: 'ACCEPTED' })));
            fetchTournament();
            success('Todos los equipos fueron aceptados exitosamente.');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al aceptar equipos masivamente');
        }
    };

    const handleInscriptionStatus = async (teamId: string, status: 'ACCEPTED' | 'REJECTED') => {
        if (!confirm(`¿Deseas ${status === 'ACCEPTED' ? 'aceptar' : 'rechazar'} a este equipo?`)) return;
        try {
            await api.patch(`/tournaments/${tournament!.id}/teams/${teamId}`, { status });
            fetchTournament();
            success('Estado actualizado');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al actualizar inscripción');
        }
    };

    const handleStartTournament = async (config: any) => {
        setGeneratingBracket(true);
        try {
            await api.post(`/tournaments/${tournamentId}/start`, config);
            await fetchTournament();
            if (tournament!.type === 'ELIMINATION') setActiveTab('bracket');
            else setActiveTab('matches');
            setActiveModal(null);
            success('Torneo iniciado y enfrentamientos generados exitosamente');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al iniciar el torneo');
        } finally {
            setGeneratingBracket(false);
        }
    };

    const handleGeneratePlayoffs = async () => {
        if (!confirm('¿Estás seguro de que deseas iniciar las eliminatorias? Esto tomará los mejores equipos de cada grupo y creará la llave eliminatoria.')) return;

        setGeneratingBracket(true);
        try {
            await api.post(`/tournaments/${tournamentId}/generate-playoffs`, {
                advancingCount: 2, // Default to 2
                matchDate: new Date()
            });
            await fetchTournament();
            setActiveTab('bracket');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al generar eliminatorias');
        } finally {
            setGeneratingBracket(false);
        }
    };

    const handleEditMatch = (match: any) => {
        setSelectedMatch(match);
        setActiveModal('editMatch');
    };

    const filteredMyTeams = myTeams.filter((t: any) => {
        const matchesSearch = t.name.toLowerCase().includes(searchTeamQuery.toLowerCase());
        const matchesDivision = filterDivision ? t.division === filterDivision : true;
        const matchesCategory = filterCategory ? t.category === filterCategory : true;
        const matchesState = filterState ? t.state === filterState : true;
        const matchesCity = filterCity ? t.city === filterCity : true;
        const matchesDistrict = filterDistrict ? t.district === filterDistrict : true;
        return matchesSearch && matchesDivision && matchesCategory && matchesState && matchesCity && matchesDistrict;
    });

    if (loading) return <div className="p-8 text-center text-text-secondary">Cargando torneo...</div>;
    if (!tournament) return <div className="p-8 text-center text-red-500">Torneo no encontrado</div>;

    const pendingInscriptions = tournament.teams.filter(t => t.status === 'PENDING');

    const statusLabels: Record<string, string> = {
        DRAFT: 'Borrador',
        REGISTRATION: 'Inscripciones Abiertas',
        IN_PROGRESS: 'En Curso',
        FINISHED: 'Finalizado',
        CANCELLED: 'Cancelado',
    };

    return (
        <div className="min-h-screen pb-32 bg-bg-primary mesh-bg">
            {/* Hero Header */}
            <div className="relative sm:h-56 h-32 bg-black border-b-8 border-accent-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                <button onClick={() => router.back()} className="absolute left-6 top-6 h-12 w-12 flex items-center justify-center bg-white/10 text-white border-2 border-white/20 hover:bg-white hover:text-black transition-all z-20">
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>
            </div>

            <div className="main-container px-6 -mt-20 relative z-10 space-y-10">
                {/* Title Area */}
                <div className="flex sm:flex-row flex-col sm:justify-between justify-center sm:items-end ">
                    <div className="flex items-end gap-6 sm:mt-0 mt-4 ">
                        <div className="h-24 w-24 bg-black border-4 border-bg-primary flex items-center justify-center shadow-xl">
                            <Trophy size={40} className="text-accent-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tighter leading-none mt-4">{tournament.name}</h1>
                            <div className="grid grid-cols-3
                             gap-2 mt-3">
                                <span className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest border-b-4 border-accent-primary">
                                    {statusLabels[tournament.status]}
                                </span>
                                {tournament.category && (
                                    <span className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest border-b-4 border-accent-primary">
                                        Cat: {tournament.category}
                                    </span>
                                )}
                                {tournament.division && (
                                    <span className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest border-b-4 border-accent-primary">
                                        Div: {tournament.division}
                                    </span>
                                )}

                                <span className="flex items-center gap-1 text-[10px] font-black text-text-secondary bg-bg-secondary px-3 py-1.5 border border-border-subtle uppercase tracking-widest">
                                    <CalendarDays size={12} />
                                    {new Date(tournament.dateStart).toLocaleDateString()}
                                </span>
                                {tournament.city && (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-text-secondary bg-bg-secondary px-3 py-1.5 border border-border-subtle uppercase tracking-widest">
                                        <MapPin size={12} className="text-accent-primary" />
                                        {tournament.city}{tournament.state ? `, ${tournament.state}` : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex max-sm:flex-col gap-2  sm:pt-0 pt-4  ">
                        {isAdmin && tournament.matches.length === 0 && tournament.status !== 'FINISHED' && tournament.status !== 'CANCELLED' && (
                            <div className="relative group">
                                <Button
                                    className={`relative overflow-hidden group text-lg px-8 py-3.5 font-black uppercase text-white shadow-xl transition-all ${tournament.teams.filter(t => t.status === 'ACCEPTED').length >= 20 ? 'bg-accent-primary hover:scale-105' : 'bg-bg-secondary text-text-secondary cursor-not-allowed border border-border-subtle'}`}
                                    onClick={() => setActiveModal('startTournament')}
                                    disabled={generatingBracket || tournament.teams.filter(t => t.status === 'ACCEPTED').length < 20}
                                >
                                    <div className="flex items-center gap-2">
                                        <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                        {generatingBracket ? 'Generando...' : 'Iniciar Torneo'}
                                    </div>
                                </Button>
                                {tournament.teams.filter(t => t.status === 'ACCEPTED').length < 20 && (
                                    <div className="absolute top-full mt-2 w-64 text-center right-0 bg-black text-red-500 text-xs p-2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-black uppercase">
                                        Faltan {20 - tournament.teams.filter(t => t.status === 'ACCEPTED').length} equipos para iniciar
                                    </div>
                                )}
                            </div>
                        )}
                        {isPresident && tournament.status === 'REGISTRATION' && (
                            <Button size="sm" onClick={() => setActiveModal('inscribe')}>Inscribir Equipo</Button>
                        )}
                        {isAdmin && (tournament.status === 'DRAFT' || tournament.status === 'REGISTRATION') && (
                            <Button variant="ghost" size="sm" onClick={() => setActiveModal('editTournament')}>
                                <Edit2 size={16} className="mr-2" />
                                Editar
                            </Button>
                        )}
                        <Link href={`/tournaments/winners`}>
                            <Button variant="ghost" size="sm">
                                <Award size={16} className="mr-2 text-accent-gold" />
                                Winners
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sm:flex grid grid-cols-2   gap-2 border-b-4 border-black pb-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'standings', label: 'Posiciones' },
                        ...((tournament.type === 'ELIMINATION' || tournament.type === 'GROUPS_ELIMINATION') ? [{ id: 'bracket', label: 'Bracket' }] : []),
                        { id: 'matches', label: 'Partidos' },
                        ...(isAdmin ? [{ id: 'inscriptions', label: `Inscripciones${pendingInscriptions.length > 0 ? ` (${pendingInscriptions.length})` : ''}` }] : []),
                        { id: 'publications', label: 'Publicaciones' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 border-black shrink-0 ${activeTab === tab.id ? 'bg-black text-white shadow-[4px_4px_0px_0px_var(--accent-primary)] -translate-y-1' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'
                                }`}
                            onClick={() => setActiveTab(tab.id as any)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        {activeTab === 'standings' && (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex gap-2">
                                        {(() => {
                                            const hasPlayoffs = tournament.matches.some(m => !!m.round);
                                            const allGroupMatchesFinished = tournament.matches.filter(m => !m.round).length > 0 &&
                                                tournament.matches.filter(m => !m.round).every(m => m.status === 'FINISHED');

                                            if (isAdmin && tournament.type === 'GROUPS_ELIMINATION' && tournament.status === 'IN_PROGRESS' && !hasPlayoffs && allGroupMatchesFinished) {
                                                return (
                                                    <Button size="sm" onClick={handleGeneratePlayoffs} isLoading={generatingBracket}>
                                                        <Trophy size={16} className="mr-2" />  INICIAR ELIMINATORIAS
                                                    </Button>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <CollapsedSearch id="search-standings" placeholder="Buscar equipo..." value={standingsSearch} onChange={setStandingsSearch} />
                                </div>

                                {(() => {
                                    if (tournament.type !== 'GROUPS_ELIMINATION') {
                                        return (
                                            <div className="bg-bg-card border-2 border-black overflow-hidden ">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-[10px] text-text-secondary bg-black text-white uppercase tracking-widest">
                                                            <tr>
                                                                <th className="px-4 py-3">#</th>
                                                                <th className="px-4 py-3">Equipo</th>
                                                                <th className="px-4 py-3 text-center">PTS</th>
                                                                <th className="px-4 py-3 text-center">PJ</th>
                                                                <th className="px-4 py-3 text-center">DF</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border-subtle">
                                                            {tournament.standings
                                                                .filter((s: any) => s.team.name.toLowerCase().includes(standingsSearch.toLowerCase()))
                                                                .map((s: any, idx: number) => {
                                                                    return (
                                                                        <tr key={s.id} className="hover:bg-bg-secondary transition-colors">
                                                                            <td className="px-4 py-3 font-black text-text-secondary">#{idx + 1}</td>
                                                                            <td className="sm:px-4 px-0 py-3 ">
                                                                                <Link href={`/teams/${s.teamId}`} className="flex items-center gap-2 font-black text-text-primary hover:text-accent-primary uppercase italic">
                                                                                    {s.team.logo ? (
                                                                                        <img src={s.team.logo} className="w-6 h-6 object-contain" />
                                                                                    ) : (
                                                                                        <div className="w-6 h-6 bg-accent-primary/20 text-accent-primary flex items-center justify-center sm:text-[12px] text-[8px] font-black">
                                                                                            {s.team.name[0]}
                                                                                        </div>
                                                                                    )}
                                                                                    <span className="truncate w-auto sm:text-[16px] text-[10px]  pr-2">{s.team.name}</span>
                                                                                </Link>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center font-black text-text-primary">{s.points}</td>
                                                                            <td className="px-4 py-3 text-center text-text-secondary">{s.played}</td>
                                                                            <td className="px-4 py-3 text-center text-text-secondary">{s.goalsFor - s.goalsAgainst}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // GROUPS_ELIMINATION Logic
                                    const teamsGroups = tournament.teams.reduce((acc: any, t: any) => {
                                        acc[t.teamId] = t.groupName;
                                        return acc;
                                    }, {});

                                    const groupedStandings: Record<string, any[]> = {};
                                    tournament.standings.forEach((s: any) => {
                                        const g = teamsGroups[s.teamId] || 'UNASSIGNED';
                                        if (!groupedStandings[g]) groupedStandings[g] = [];
                                        groupedStandings[g].push(s);
                                    });

                                    return Object.entries(groupedStandings)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([groupName, groupStandings]) => (
                                            <div key={groupName} className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-black text-white flex items-center justify-center font-black text-sm border-b-2 border-accent-primary">
                                                        {groupName}
                                                    </div>
                                                    <h3 className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Grupo {groupName}</h3>
                                                </div>
                                                <div className="bg-bg-card border-2 border-black overflow-hidden ">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="text-[10px] text-text-secondary bg-black text-white uppercase tracking-widest">
                                                                <tr>
                                                                    <th className="px-4 py-3">#</th>
                                                                    <th className="px-4 py-3">Equipo</th>
                                                                    <th className="px-4 py-3 text-center">PTS</th>
                                                                    <th className="px-4 py-3 text-center">PJ</th>
                                                                    <th className="px-4 py-3 text-center">DF</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border-subtle">
                                                                {groupStandings
                                                                    .filter((s: any) => s.team.name.toLowerCase().includes(standingsSearch.toLowerCase()))
                                                                    .map((s: any, idx: number) => (
                                                                        <tr key={s.id} className="hover:bg-bg-secondary transition-colors">
                                                                            <td className="px-4 py-3 font-black text-text-secondary">#{idx + 1}</td>
                                                                            <td className="sm:px-4 px-0 py-3 ">
                                                                                <Link href={`/teams/${s.teamId}`} className="flex items-center gap-2 font-black text-text-primary hover:text-accent-primary uppercase italic">
                                                                                    {s.team.logo ? (
                                                                                        <img src={s.team.logo} className="w-6 h-6 object-contain" alt="" />
                                                                                    ) : (
                                                                                        <div className="w-6 h-6 bg-accent-primary/20 text-accent-primary flex items-center justify-center text-[10px]">
                                                                                            {s.team.name[0]}
                                                                                        </div>
                                                                                    )}
                                                                                    <span className="truncate w-auto sm:text-[16px] text-[10px] pr-2">{s.team.name}</span>
                                                                                </Link>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center font-black text-text-primary">{s.points}</td>
                                                                            <td className="px-4 py-3 text-center text-text-secondary">{s.played}</td>
                                                                            <td className="px-4 py-3 text-center text-text-secondary">{s.goalsFor - s.goalsAgainst}</td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                })()}
                            </div>
                        )}

                        {activeTab === 'bracket' && (
                            <div className="space-y-4">
                                <TournamentBracket matches={processedMatches} />
                            </div>
                        )}

                        {activeTab === 'matches' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-2">
                                    <div className="flex gap-6">
                                        <button
                                            onClick={() => setMatchesViewMode('list')}
                                            className={`text-[10px] font-black uppercase tracking-widest transition-all ${matchesViewMode === 'list' ? 'text-accent-primary border-b-2 border-accent-primary pb-2 -mb-[10px]' : 'text-text-secondary hover:text-text-primary pb-2 -mb-[10px]'}`}
                                        >
                                            Lista de Partidos
                                        </button>
                                        {tournament.type === 'LEAGUE' && (
                                            <button
                                                onClick={() => setMatchesViewMode('fixture')}
                                                className={`text-[10px] font-black uppercase tracking-widest transition-all ${matchesViewMode === 'fixture' ? 'text-accent-primary border-b-2 border-accent-primary pb-2 -mb-[10px]' : 'text-text-secondary hover:text-text-primary pb-2 -mb-[10px]'}`}
                                            >
                                                Diagrama de Fixture
                                            </button>
                                        )}
                                    </div>
                                    {matchesViewMode === 'list' && (
                                        <div className="flex justify-end">
                                            <CollapsedSearch id="search-matches" placeholder="Buscar equipo o jornada..." value={matchesSearch} onChange={setMatchesSearch} />
                                        </div>
                                    )}
                                </div>

                                {matchesViewMode === 'fixture' && tournament.type === 'LEAGUE' && processedMatches.length > 0 ? (
                                    <AnimatedFixture matches={processedMatches} />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {processedMatches.length === 0 ? (
                                            <div className="col-span-full py-20 text-center border-4 border-dashed border-black/10">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No hay partidos programados</p>
                                            </div>
                                        ) : (
                                            processedMatches
                                                .filter((m: any) =>
                                                    (m.homeTeam?.name || '').toLowerCase().includes(matchesSearch.toLowerCase()) ||
                                                    (m.awayTeam?.name || '').toLowerCase().includes(matchesSearch.toLowerCase()) ||
                                                    (m.matchDay && `jornada ${m.matchDay}`.includes(matchesSearch.toLowerCase())) ||
                                                    (m.groupName && `grupo ${m.groupName}`.includes(matchesSearch.toLowerCase()))
                                                )
                                                .map((m: any) => (
                                                    <div key={m.id} className="bg-bg-card border-2 border-black overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col">
                                                        <div className="flex items-center justify-between px-4 py-2 bg-black text-white border-b-2 border-accent-primary">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black text-accent-primary uppercase tracking-widest">
                                                                    {m.matchDay ? `Jornada ${m.matchDay}` : m.round || 'Partido'}
                                                                </span>
                                                                {m.groupName && (
                                                                    <span className="px-1.5 py-0.5 bg-accent-primary text-black text-[7px] font-black border border-black transform -skew-x-12">
                                                                        GRUPO {m.groupName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Link href={`/matches/${m.id}`} className="p-5 flex flex-col h-full justify-between gap-4">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex-1 flex flex-col items-end text-right">
                                                                    <span className="text-[10px] uppercase font-black text-text-secondary mb-1 opacity-40">Local</span>
                                                                    <span className="text-sm font-black text-text-primary leading-tight break-words uppercase italic">{m.homeTeam?.name || 'Por definir'}</span>
                                                                </div>
                                                                <div className="bg-black text-white px-4 py-2 flex items-center gap-2 border-b-4 border-accent-primary">
                                                                    <span className="text-xl font-black italic">{m.homeGoals}</span>
                                                                    <span className="text-xs opacity-30">:</span>
                                                                    <span className="text-xl font-black italic">{m.awayGoals}</span>
                                                                </div>
                                                                <div className="flex-1 flex flex-col items-start text-left">
                                                                    <span className="text-[10px] uppercase font-black text-text-secondary mb-1 opacity-40">Visita</span>
                                                                    <span className="text-sm font-black text-text-primary leading-tight break-words uppercase italic">{m.awayTeam?.name || 'Por definir'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 pt-3 border-t-2 border-border-subtle flex items-center justify-between text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <CalendarDays size={10} />
                                                                        {new Date(m.matchDate).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        {m.matchTime || '--:--'}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 max-w-[120px] truncate">
                                                                    <MapPin size={10} className="text-accent-primary" />
                                                                    {m.stadium}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))
                                        )
                                        }
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'inscriptions' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest">Inscritos ({tournament.teams.length})</h3>
                                    <CollapsedSearch id="search-inscriptions" placeholder="Buscar equipo..." value={inscriptionsSearch} onChange={setInscriptionsSearch} />
                                </div>
                                {isAdmin && pendingInscriptions.length > 0 && (
                                    <div className="flex justify-end">
                                        <Button onClick={handleAcceptAllPending}>Aceptar Todos ({pendingInscriptions.length})</Button>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {tournament.teams
                                        .filter((t: any) => t.team.name.toLowerCase().includes(inscriptionsSearch.toLowerCase()))
                                        .map((t: any) => (
                                            <div key={t.id} className="flex items-center justify-between bg-bg-card border-2 border-black p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-bg-secondary border border-border-subtle flex items-center justify-center">
                                                        {t.team.logo ? <img src={t.team.logo} className="h-full w-full object-cover" /> : <Shield size={20} className="text-text-secondary" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-text-primary uppercase italic text-sm">{t.team.name}</p>
                                                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{t.status}</p>
                                                    </div>
                                                </div>
                                                {t.status === 'PENDING' && isAdmin && (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="danger" onClick={() => handleInscriptionStatus(t.team.id, 'REJECTED')}>X</Button>
                                                        <Button size="sm" onClick={() => handleInscriptionStatus(t.team.id, 'ACCEPTED')}>OK</Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'publications' && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    {isAdmin && (
                                        <Button className="flex-1" onClick={() => setActiveModal('createPublication')}>Crear Publicación</Button>
                                    )}
                                    <CollapsedSearch id="search-publications" placeholder="Buscar en el muro..." value={publicationsSearch} onChange={setPublicationsSearch} />
                                </div>
                                {pubsLoading ? <div className="text-center p-8 text-text-secondary">Cargando...</div> :
                                    publications
                                        .filter(pub => pub.content.toLowerCase().includes(publicationsSearch.toLowerCase()) || pub.author.name.toLowerCase().includes(publicationsSearch.toLowerCase()))
                                        .map(pub => (
                                            <PublicationCard key={pub.id} publication={pub} onUpdate={fetchPublications} />
                                        ))
                                }
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <Modal isOpen={activeModal === 'inscribe'} onClose={() => setActiveModal(null)} title="Inscribir Equipo">
                <div className="space-y-4">
                    <div className="bg-accent-primary/10 border-2 border-accent-primary p-4 mb-2">
                        <p className="text-[10px] uppercase font-black text-accent-primary tracking-widest mb-1">Requisitos del Torneo</p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-text-primary font-bold">
                            <span className="bg-bg-secondary px-2 py-0.5 border border-border-subtle">Cat: {tournament.category || 'Abierta'}</span>
                            <span className="bg-bg-secondary px-2 py-0.5 border border-border-subtle">Div: {tournament.division || 'Abierta'}</span>
                            <span className="bg-bg-secondary px-2 py-0.5 border border-border-subtle">Prov: {tournament.state || 'Todas'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input type="text" placeholder="Buscar por nombre..." value={searchTeamQuery} onChange={e => setSearchTeamQuery(e.target.value)} className="w-full bg-bg-secondary border-2 border-black p-2.5 pl-10 text-text-primary outline-none focus:border-accent-primary tracking-tight text-sm" />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 text-[10px] uppercase font-black tracking-widest border-2 border-accent-primary text-accent-primary hover:bg-accent-primary/10"
                            onClick={() => {
                                const eligibleIds = filteredMyTeams
                                    .filter(t => !tournament!.teams.some(inscribed => inscribed.team.id === t.id))
                                    .filter(t => (!tournament!.category || t.category === tournament!.category) && (!tournament!.division || t.division === tournament!.division))
                                    .map(t => t.id);
                                setSelectedTeamIds(eligibleIds);
                            }}
                        >
                            Todos
                        </Button>
                    </div>

                    <div className="max-h-64 mt-2 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                        {filteredMyTeams.filter(t => !tournament!.teams.some(inscribed => inscribed.team.id === t.id)).length === 0 ? (
                            <p className="text-center text-text-secondary py-4 text-sm">No se encontraron equipos o ya están inscritos.</p>
                        ) : (
                            filteredMyTeams
                                .filter(t => !tournament!.teams.some(inscribed => inscribed.team.id === t.id))
                                .map(t => {
                                    const isEligible = (!tournament!.category || t.category === tournament!.category) &&
                                        (!tournament!.division || t.division === tournament!.division);
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => {
                                                if (!isEligible) return;
                                                setSelectedTeamIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]);
                                            }}
                                            className={`flex items-center gap-3 p-3 border-2 transition-all cursor-pointer relative ${!isEligible ? 'bg-bg-secondary border-border-subtle opacity-50 cursor-not-allowed' :
                                                selectedTeamIds.includes(t.id) ? 'bg-accent-primary/10 border-accent-primary' : 'bg-bg-card border-black hover:bg-bg-secondary'
                                                }`}
                                        >
                                            <div className="flex h-10 w-10 items-center shrink-0 justify-center bg-bg-secondary text-text-primary font-bold text-sm border border-border-subtle">
                                                {t.logo ? <img src={t.logo} className="h-full w-full object-cover" /> : t.name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-text-primary truncate text-sm uppercase italic">{t.name}</p>
                                                <p className="text-[10px] text-text-secondary truncate font-bold uppercase">
                                                    {t.category || 'Sin Cat'} • {t.division || 'Sin Div'} • {t.city || 'Sin ciudad'}
                                                </p>
                                            </div>
                                            {isEligible && selectedTeamIds.includes(t.id) && (
                                                <CheckCircle2 size={20} className="text-accent-primary shrink-0" />
                                            )}
                                            {!isEligible && (
                                                <div className="text-[9px] text-red-500 text-right shrink-0 max-w-[60px] leading-tight font-black uppercase">Cat o Div. Diferente</div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                        <Button variant="ghost" className="flex-1" onClick={() => setActiveModal(null)}>Cancelar</Button>
                        <Button onClick={handleInscribe} disabled={selectedTeamIds.length === 0} className="flex-[2]">
                            {selectedTeamIds.length > 0 ? `Inscribir (${selectedTeamIds.length})` : 'Seleccionar equipos'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={activeModal === 'createMatch'} onClose={() => setActiveModal(null)} title="Crear Partido">
                <form onSubmit={handleCreateMatch} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <select required value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)} className="bg-bg-secondary border-2 border-black p-3 text-text-primary">
                            <option value="">Local</option>
                            {tournament.teams.filter(t => t.status === 'ACCEPTED').map(t => <option key={t.team.id} value={t.team.id}>{t.team.name}</option>)}
                        </select>
                        <select required value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)} className="bg-bg-secondary border-2 border-black p-3 text-text-primary">
                            <option value="">Visitante</option>
                            {tournament.teams.filter(t => t.status === 'ACCEPTED').map(t => <option key={t.team.id} value={t.team.id}>{t.team.name}</option>)}
                        </select>
                    </div>
                    <input type="datetime-local" required className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
                    <Button type="submit" className="w-full">Crear</Button>
                </form>
            </Modal>

            <Modal isOpen={activeModal === 'createPublication'} onClose={() => setActiveModal(null)} title="Nueva Publicación">
                <form onSubmit={handleCreatePublication} className="space-y-4">
                    <textarea required value={newPubContent} onChange={e => setNewPubContent(e.target.value)} placeholder="Escribe algo..." className="w-full h-32 bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none resize-none focus:border-accent-primary" />
                    <Button type="submit" className="w-full">Publicar</Button>
                </form>
            </Modal>

            <StartTournamentModal
                isOpen={activeModal === 'startTournament'}
                onClose={() => setActiveModal(null)}
                onConfirm={handleStartTournament}
                loading={generatingBracket}
                tournamentName={tournament.name}
                tournamentType={tournament.type}
            />
            <EditMatchModal isOpen={activeModal === 'editMatch'} onClose={() => setActiveModal(null)} match={selectedMatch} onUpdate={fetchTournament} />

            <Modal isOpen={activeModal === 'editTournament'} onClose={() => setActiveModal(null)} title="Editar Torneo">
                <CreateTournamentForm
                    initialData={tournament}
                    onSuccess={() => { setActiveModal(null); fetchTournament(); success('Torneo actualizado exitosamente'); }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>
        </div>
    );
}

function CollapsedSearch({ id, placeholder, value, onChange }: { id: string, placeholder: string, value: string, onChange: (v: string) => void }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="relative flex items-center justify-end">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ width: 0, opacity: 0, x: 20 }}
                        animate={{ width: '200px', opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="overflow-hidden mr-2"
                    >
                        <div className="relative">
                            <input
                                id={id}
                                type="text"
                                placeholder={placeholder}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full bg-bg-secondary border-2 border-accent-primary py-2 px-4 pr-8 text-xs text-text-primary placeholder-text-secondary outline-none font-black uppercase tracking-widest"
                                autoFocus
                            />
                            {value && (
                                <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`h-10 w-10 flex items-center justify-center transition-all border-2 border-black ${isExpanded ? 'bg-accent-primary text-white' : 'bg-bg-card text-text-secondary hover:bg-bg-secondary'}`}
            >
                <Search size={16} className={isExpanded ? 'scale-110' : ''} />
            </button>
        </div>
    );
}
