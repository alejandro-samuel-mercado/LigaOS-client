'use client';

import { api } from '@/adapters/http';
import { PublicationCard } from '@/components/features/social/PublicationCard';
import { LABELS } from '@/content/labels';
import { ROLE_LABELS } from '@/content/roles';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { usePersistentData } from '@/hooks/usePersistentData';
import { AnimatePresence, motion } from 'framer-motion';
import {
      ChevronDown,
      ChevronRight,
      Filter,
      MapPin,
      MessageSquare,
      Search,
      Shield,
      Trophy,
      Users
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

interface SearchResults {
    publications?: Array<any>;
    users?: Array<{ id: string; name: string; lastName: string; image: string | null; role: string }>;
    teams?: Array<{ id: string; name: string; nameShort: string | null; logo: string | null; city: string; category: string; division: string; state: string }>;
    tournaments?: Array<{ id: string; name: string; status: string; dateStart: string; city: string | null; state: string | null }>;
}

interface PaginationData {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}


type SearchType = 'all' | 'publications' | 'teams' | 'tournaments' | 'users';

const TYPE_FILTERS: Array<{ key: SearchType; label: string; icon: React.ElementType }> = [
    { key: 'all', label: 'Todo', icon: Search },
    { key: 'publications', label: 'Publicaciones', icon: MessageSquare },
    { key: 'teams', label: 'Equipos', icon: Shield },
    { key: 'tournaments', label: 'Torneos', icon: Trophy },
    { key: 'users', label: 'Usuarios', icon: Users },
];

const EMPTY_ARRAY: any[] = [];
const DEFAULT_STATES = ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza'];

function SocialContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('query') || '';

    const [query, setQuery] = useState(initialQuery);
    const [type, setType] = useState<SearchType>('publications');
    const [results, setResults] = useState<SearchResults>({});
    const [pagination, setPagination] = useState<Record<string, PaginationData>>({});
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const { user } = useAuth();
    const { location, isLoaded } = useLocation();

    // Filters
    const [categoryFilter, setCategoryFilter] = useState('');
    const [divisionFilter, setDivisionFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const { data: categoriesRaw } = usePersistentData<any[]>(
        'categories_list',
        async () => {
            const { data } = await api.get('/categories');
            return data.data;
        }
    );
    const categories = categoriesRaw || EMPTY_ARRAY;

    const { data: divisionsRaw } = usePersistentData<any[]>(
        'divisions_list',
        async () => {
            const { data } = await api.get('/divisions');
            return data.data;
        }
    );
    const divisions = divisionsRaw || EMPTY_ARRAY;

    const { data: statesRaw } = usePersistentData<string[]>(
        'states_list',
        async () => {
            const { data } = await api.get('/search/states');
            return data.data;
        }
    );
    const states = statesRaw || DEFAULT_STATES;

    const { data: citiesRaw } = usePersistentData<string[]>(
        `cities_list_${stateFilter}`,
        async () => {
            const { data } = await api.get(`/search/cities?state=${stateFilter}`);
            return data.data;
        },
        [stateFilter]
    );
    const cities = citiesRaw || EMPTY_ARRAY;

    // Infinite Scroll for Publications
    const loaderRef = useRef<HTMLDivElement>(null);

    // Load cache on mount
    useEffect(() => {
        const cached = localStorage.getItem('social_search_cache');
        if (cached) {
            try {
                const { results: cachedResults, pagination: cachedPagination, type: cachedType } = JSON.parse(cached);
                setResults(cachedResults);
                setPagination(cachedPagination);
                setType(cachedType);
            } catch (e) {
              
            }
        }
    }, []);

    const performSearch = useCallback(async (searchQuery: string, searchType: SearchType, page: number = 1, append: boolean = false) => {
        if (searchQuery.length === 1 && !append) return;

        if (append) setLoadingMore(true);
        else setLoading(true);

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('query', searchQuery);
            if (searchType !== 'all') params.set('type', searchType);
            params.set('page', page.toString());
            params.set('pageSize', '30');
                        // Global Location Context Filter
            // For users, we default to global search unless a state is explicitly picked in the page
            const activeState = stateFilter || (searchType !== 'users' ? location.state : '');
            if (activeState) params.set('state', activeState);
            
            // Add other filters
            if (searchType === 'teams') {
                if (categoryFilter) params.set('category', categoryFilter);
                if (divisionFilter) params.set('division', divisionFilter);
                if (cityFilter) params.set('city', cityFilter);
            }
            if (searchType === 'users' && roleFilter) {
                params.set('role', roleFilter);
            }

            const { data } = await api.get(`/search?${params.toString()}`);

            const newResults = data.data;
            const newPagination = data.pagination;

            if (append) {
                setResults(prev => {
                    const updated = { ...prev };
                    if (searchType === 'publications') updated.publications = [...(prev.publications || []), ...(newResults.publications || [])];
                    if (searchType === 'teams') updated.teams = [...(prev.teams || []), ...(newResults.teams || [])];
                    if (searchType === 'users') updated.users = [...(prev.users || []), ...(newResults.users || [])];
                    if (searchType === 'tournaments') updated.tournaments = [...(prev.tournaments || []), ...(newResults.tournaments || [])];
                    return updated;
                });
            } else {
                setResults(newResults);
                // Save to cache
                localStorage.setItem('social_search_cache', JSON.stringify({
                    results: newResults,
                    pagination: newPagination,
                    type: searchType,
                    timestamp: Date.now()
                }));
            }
            setPagination(prev => ({ ...prev, ...newPagination }));
        } catch (e) {
           
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [categoryFilter, divisionFilter, stateFilter, cityFilter, roleFilter, location.state]);

    // Initial search or filter change
    useEffect(() => {
        if (!isLoaded) return;
        const timer = setTimeout(() => {
            performSearch(query, type, 1, false);
        }, 400);
        return () => clearTimeout(timer);
    }, [query, type, categoryFilter, divisionFilter, stateFilter, cityFilter, roleFilter, location.state, isLoaded, performSearch]);

    // Infinite scroll observer
    const loadingRef = useRef(loading);
    const loadingMoreRef = useRef(loadingMore);
    const paginationRef = useRef(pagination);

    useEffect(() => {
        loadingRef.current = loading;
        loadingMoreRef.current = loadingMore;
        paginationRef.current = pagination;
    }, [loading, loadingMore, pagination]);

    useEffect(() => {
        if (type === 'all') return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingRef.current && !loadingMoreRef.current) {
                const typePagination = paginationRef.current?.[type];
                if (typePagination) {
                    const nextPage = (typePagination.page || 1) + 1;
                    if (nextPage <= (typePagination.totalPages || 0)) {
                        performSearch(query, type, nextPage, true);
                    }
                }
            }
        }, { threshold: 0.1 });

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [type, performSearch, query]);

    const hasResults = (results.publications?.length ?? 0) + (results.users?.length ?? 0) + (results.teams?.length ?? 0) + (results.tournaments?.length ?? 0) > 0;

    return (
        <div className="min-h-screen pb-32 bg-bg-primary mesh-bg">
            <div className="main-container px-6 py-12 space-y-12">
                <div className="flex flex-col gap-8">
                    <div className="flex items-end justify-between border-b-8 border-black pb-4">
                        <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none italic">SOCIAL</h1>
                        <div className="h-4 w-24 bg-accent-primary" />
                    </div>

                    <div className="relative group bg-bg-card p-2 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-accent-primary" />
                        <input
                            type="text"
                            placeholder="BUSCAR TORNEOS, EQUIPOS, JUGADORES..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-bg-secondary border-2 border-gray-300 py-2 pl-16 pr-8 text-lg font-black uppercase text-text-primary placeholder:text-text-secondary placeholder:opacity-30 outline-none focus:ring-2 focus:ring-accent-primary transition-all"
                        />
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-0 -mx-6 px-6">
                    {TYPE_FILTERS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => { setType(key); }}
                            className={`flex shrink-0 items-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${type === key
                                ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_var(--accent-primary)] -translate-y-1'
                                : 'bg-white text-text-secondary border-black/10 hover:border-black hover:bg-bg-secondary'
                                }`}
                        >
                            <Icon size={14} strokeWidth={3} />
                            {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence>
                    {(type === 'teams' || type === 'users') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className=""
                        >
                            <div className=" bg-black text-white p-3 border-b-8 border-accent-primary relative group">
                                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-accent-primary/20 to-transparent pointer-events-none" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                                    {type === 'teams' ? (
                                        <>
                                            <CustomSelect
                                                label="Categoría"
                                                value={categoryFilter}
                                                onChange={setCategoryFilter}
                                                options={categories.map((c: any) => ({ value: c.name, label: c.name }))}
                                                placeholder="Todas"
                                            />
                                            <CustomSelect
                                                label="División"
                                                value={divisionFilter}
                                                onChange={setDivisionFilter}
                                                options={divisions.map((d: any) => ({ value: d.name, label: d.name }))}
                                                placeholder="Todas"
                                            />
                                            <CustomSelect
                                                label="Provincia"
                                                value={stateFilter}
                                                onChange={setStateFilter}
                                                options={states.map((s: string) => ({ value: s, label: s }))}
                                                placeholder="Todas"
                                            />
                                            <CustomSelect
                                                label="Ciudad"
                                                value={cityFilter}
                                                onChange={setCityFilter}
                                                options={cities.map((c: string) => ({ value: c, label: c }))}
                                                placeholder="Todas"
                                            />
                                        </>
                                    ) : (
                                        <div className="col-span-full">
                                            <CustomSelect
                                                label="Rol de Usuario"
                                                value={roleFilter}
                                                onChange={setRoleFilter}
                                                options={Object.entries(ROLE_LABELS).map(([key, label]) => ({ value: key, label: label as string }))}
                                                placeholder="Todos los Roles"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading && !hasResults ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 w-full bg-bg-card border-2 border-black/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full animate-shimmer" />
                                <div className="p-6 flex gap-5">
                                    <div className="h-16 w-16 bg-black/5" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-1/3 bg-black/5" />
                                        <div className="h-2 w-full bg-black/5" />
                                        <div className="h-2 w-2/3 bg-black/5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !hasResults && !loading ? (
                    <div className="flex flex-col h-64 items-center justify-center text-sm border border-dashed border-border-subtle rounded-[3rem] gap-4 bg-bg-secondary/50 backdrop-blur-sm shadow-inner">
                        <div className="h-20 w-20 rounded-[2rem] bg-accent-primary/5 flex items-center justify-center text-accent-primary/20">
                            <Filter size={40} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-black uppercase tracking-[0.3em] text-[11px] text-text-primary">{LABELS.common.noResults}</p>
                            <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest text-text-secondary">Intenta con otros filtros o términos</p>
                        </div>
                    </div>
                ) : (
                        <div className="relative min-h-[400px]">
                            {loading && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                    <div className="bg-accent-primary text-white text-[10px] font-black px-5 py-2 rounded-full shadow-2xl shadow-accent-primary/40 flex items-center gap-2 border border-white/20 animate-bounce">
                                        <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ACTUALIZANDO
                                    </div>
                                </div>
                            )}
                            <AnimatePresence mode="popLayout">
                            <motion.div
                                    key={`${query}-${type}-${categoryFilter}-${divisionFilter}-${stateFilter}-${cityFilter}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="space-y-8"
                                >
                                {results.publications && results.publications.length > 0 && (
                                    <ResultSection title="Publicaciones" icon={MessageSquare}>
                                        {results.publications.map((pub) => (
                                            <PublicationCard
                                                key={pub.id}
                                                publication={{
                                                    ...pub,
                                                    likesCount: pub._count?.likes ?? 0,
                                                    commentsCount: pub._count?.comments ?? 0,
                                                    isLikedByMe: false
                                                }}
                                                onUpdate={() => performSearch(query, type)}
                                            />
                                        ))}
                                        {type === 'publications' && (
                                            <div ref={loaderRef} className="h-20 flex items-center justify-center">
                                                {loadingMore && <div className="h-6 w-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />}
                                            </div>
                                        )}
                                    </ResultSection>
                                )}

                                {results.tournaments && results.tournaments.length > 0 && (
                                    <ResultSection title="Torneos" icon={Trophy}>
                                        <div className="grid grid-cols-1 gap-4">
                                            {results.tournaments.map((tournament) => (
                                                <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="group flex items-center gap-5 bg-bg-card border-2 border-black p-5 hover:bg-bg-secondary hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1">
                                                    <div className="h-16 w-16 bg-black flex items-center justify-center text-accent-primary border-b-4 border-accent-primary group-hover:scale-105 transition-all"><Trophy size={32} /></div>
                                                    <div className="flex-1">
                                                        <p className="text-xl font-black text-text-primary uppercase tracking-tighter italic leading-none">{tournament.name}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-[10px] text-text-secondary flex items-center gap-1 font-black uppercase opacity-60"><MapPin size={10} /> {tournament.city}{tournament.state ? `, ${tournament.state}` : ''}</span>
                                                            <div className="h-1 w-1 bg-accent-primary" />
                                                            <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em]">{tournament.status}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={24} className="text-black opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                                </Link>
                                            ))}
                                        </div>
                                        {type === 'tournaments' && <PaginationControls type="tournaments" pagination={pagination.tournaments} onPageChange={(p: number) => performSearch(query, type, p)} />}
                                    </ResultSection>
                                )}

                                {results.teams && results.teams.length > 0 && (
                                    <ResultSection title="Equipos" icon={Shield}>
                                        <div className="grid grid-cols-1 gap-4">
                                            {results.teams.map((team) => (
                                                <Link key={team.id} href={`/teams/${team.id}`} className="group flex items-center gap-5 bg-bg-card border-2 border-black p-5 hover:bg-bg-secondary hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1">
                                                    <div className="h-16 w-16 bg-white border-2 border-black flex items-center justify-center overflow-hidden group-hover:-rotate-3 transition-all p-2 bg-gradient-to-br from-white to-gray-100">
                                                        {team.logo ? <img src={team.logo} className="h-full w-full object-contain" /> : <Shield size={32} className="text-black opacity-10" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xl font-black text-text-primary uppercase tracking-tighter italic leading-none">{team.name}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-[10px] text-text-secondary font-black uppercase opacity-60">{team.city}</span>
                                                            <div className="h-1 w-1 bg-accent-primary" />
                                                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">{team.category} • {team.division}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={24} className="text-black opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                                </Link>
                                            ))}
                                        </div>
                                        {type === 'teams' && <PaginationControls type="teams" pagination={pagination.teams} onPageChange={(p: number) => performSearch(query, type, p)} />}
                                    </ResultSection>
                                )}

                                {results.users && results.users.length > 0 && (
                                    <ResultSection title="Usuarios" icon={Users}>
                                        <div className="grid grid-cols-1 gap-4">
                                            {results.users.map((item) => (
                                                <Link key={item.id} href={`/players/${item.id}`} className="group flex items-center gap-5 bg-bg-card border-2 border-black p-5 hover:bg-bg-secondary hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1">
                                                    <div className="h-16 w-16 bg-black border-2 border-black flex items-center justify-center text-white overflow-hidden group-hover:scale-105 transition-all">
                                                        {item.image ? <img src={item.image} className="h-full w-full object-cover" /> : <Users size={32} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xl font-black text-text-primary uppercase tracking-tighter italic leading-none">{item.name} {item.lastName}</p>
                                                        <p className="text-[10px] font-black text-accent-primary uppercase mt-2 tracking-[0.3em] italic">{ROLE_LABELS[item.role] || item.role}</p>
                                                    </div>
                                                    <ChevronRight size={24} className="text-black opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                                </Link>
                                            ))}
                                        </div>
                                        {type === 'users' && <PaginationControls type="users" pagination={pagination.users} onPageChange={(p: number) => performSearch(query, type, p)} />}
                                    </ResultSection>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SocialPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg-primary flex items-center justify-center text-accent-primary font-black uppercase tracking-widest italic">Cargando Social...</div>}>
            <SocialContent />
        </Suspense>
    );
}

function CustomSelect({ label, value, onChange, options, placeholder }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find((o: any) => o.value === value)?.label || placeholder;

    return (
        <div className="relative space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block ml-1 italic">{label}</span>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 bg-white/5 border-2 border-white/10 hover:border-white/30 transition-all p-4 text-[10px] font-black uppercase tracking-widest group"
            >
                <span className={value ? 'text-white' : 'text-white/40'}>{selectedLabel}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-accent-primary`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#082032] border-2 border-white/20 shadow-2xl"
                        >
                            <div className="max-h-60 overflow-y-auto scrollbar-hide py-2">
                                <button
                                    onClick={() => { onChange(''); setIsOpen(false); }}
                                    className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white hover:text-black transition-all border-b border-white/5"
                                >
                                    {placeholder}
                                </button>
                                {options.map((opt: any) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                        className={`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b border-white/5 ${value === opt.value ? 'bg-accent-primary text-white' : 'text-white/80 hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function ResultSection({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) {
    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between border-b-4 border-black pb-4 mb-4">

            </div>
            <div className="grid grid-cols-1 gap-6">{children}</div>
        </div>
    );
}

function PaginationControls({ type, pagination, onPageChange }: { type: string, pagination?: PaginationData, onPageChange: (p: number) => void }) {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between border-4 border-black p-4 bg-white/5 backdrop-blur-sm mt-12 mb-8">
            <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary disabled:opacity-20 transition-all border-b-4 border-accent-primary active:translate-y-1 active:border-b-0"
            >
                Anterior
            </button>
            <div className="flex flex-col items-center">
                <span className="text-xl font-black italic">{pagination.page} <span className="text-text-secondary opacity-30">/ {pagination.totalPages}</span></span>
            </div>
            <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary disabled:opacity-20 transition-all border-b-4 border-accent-primary active:translate-y-1 active:border-b-0"
            >
                Siguiente
            </button>
        </div>
    );
}
