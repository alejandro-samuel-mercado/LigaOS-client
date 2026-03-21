/**
 * Management Page — Centralized dashboard for Admins and Presidents.
 * Role-based cards for creating Teams, Players, Referees, and Tournaments.
 */

'use client';

import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    UserPlus,
    Trophy,
    Plus,
    ChevronLeft,
    MapPin
} from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CreateTeamForm } from '@/components/features/management/CreateTeamForm';
import { CreateUserForm } from '@/components/features/management/CreateUserForm';
import { CreateTournamentForm } from '@/components/features/management/CreateTournamentForm';
import { CreateGroupForm } from '@/components/features/management/CreateGroupForm';
import { Filter, Layers, List } from 'lucide-react';
import { EntityManager } from '@/components/features/management/EntityManager';

export default function ManagementPage() {
    const { user, isLoading } = useAuth();
    const { success } = useAlert();
    const router = useRouter();

    const [activeModal, setActiveModal] = useState<'team' | 'player' | 'referee' | 'tournament' | 'coach' | 'president' | 'group' | 'category' | 'division' | 'city' | 'state' | null>(null);

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const isPresident = user?.role === 'PRESIDENT';

    useEffect(() => {
        if (!isLoading && !isAdmin && !isPresident) {
            router.push('/');
        }
    }, [user, isLoading, isAdmin, isPresident, router]);

    if (isLoading || (!isAdmin && !isPresident)) return null;

    const actions = [
        {
            title: 'Crear Equipo',
            description: 'Registrar un nuevo equipo',
            icon: Shield,
            show: isAdmin || isPresident,
            onClick: () => setActiveModal('team'),
        },
        {
            title: 'Inscribir Jugador',
            description: 'Dar de alta un nuevo jugador',
            icon: UserPlus,
            show: isAdmin || isPresident,
            onClick: () => setActiveModal('player'),
        },
        {
            title: 'Crear Árbitro',
            description: 'Registrar personal colegiado',
            icon: Whistle,
            show: isAdmin,
            onClick: () => setActiveModal('referee'),
        },
        {
            title: 'Crear Torneo',
            description: 'Configurar una nueva competición',
            icon: Trophy,
            show: isAdmin,
            onClick: () => setActiveModal('tournament'),
        },
        {
            title: 'Crear DT',
            description: 'Registrar un nuevo Director Técnico',
            icon: UserPlus,
            show: isAdmin || isPresident,
            onClick: () => setActiveModal('coach'),
        },
        {
            title: 'Crear Presidente',
            description: 'Registrar un nuevo Presidente de Equipo',
            icon: UserPlus,
            show: isAdmin,
            onClick: () => setActiveModal('president'),
        },
        {
            title: 'Gestionar Grupos',
            description: 'Ver, crear y eliminar grupos de búsqueda',
            icon: Filter,
            show: isAdmin,
            onClick: () => setActiveModal('group'),
        },
        {
            title: 'Gestionar Categorías',
            description: 'Definir categorías (Sub-20, Primera, etc)',
            icon: List,
            show: isAdmin,
            onClick: () => setActiveModal('category'),
        },
        {
            title: 'Gestionar Divisiones',
            description: 'Configurar divisiones (A, B, C, etc)',
            icon: Layers,
            show: isAdmin,
            onClick: () => setActiveModal('division'),
        },
        {
            title: 'Gestionar Ciudades',
            description: 'Configurar ciudades disponibles',
            icon: MapPin,
            show: isAdmin,
            onClick: () => setActiveModal('city'),
        },
        {
            title: 'Gestionar Provincias',
            description: 'Configurar provincias o estados',
            icon: MapPin,
            show: isAdmin,
            onClick: () => setActiveModal('state'),
        },
    ];

    return (
        <div className="main-container px-6 py-12 space-y-12 bg-bg-primary mesh-bg min-h-screen">
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => router.back()}
                    className="h-12 w-12 flex items-center justify-center border-2 border-black bg-bg-card text-text-primary hover:bg-black hover:text-white transition-all"
                >
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <div className="flex items-end justify-between flex-1 border-b-8 border-black pb-4">
                    <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none italic">Panel de Gestión</h1>
                    <div className="h-4 w-24 bg-accent-primary" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {actions.filter(a => a.show).map((action, i) => (
                    <motion.button
                        key={action.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={action.onClick}
                        className="flex items-center gap-5 bg-bg-card border-2 border-black p-6 text-left transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-1 group"
                    >
                        <div className="flex h-16 w-16 items-center justify-center bg-black text-accent-primary border-b-4 border-accent-primary group-hover:scale-105 transition-transform shrink-0">
                            <action.icon size={28} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-text-primary group-hover:text-accent-primary transition-colors uppercase italic text-lg tracking-tighter leading-none">
                                {action.title}
                            </h3>
                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-1 opacity-60">{action.description}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center bg-bg-secondary text-text-secondary border border-border-subtle group-hover:bg-accent-primary group-hover:text-white transition-all">
                            <Plus size={18} />
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="pt-4 border-t-2 border-border-subtle">
                <p className="text-[10px] text-center text-text-secondary italic font-black uppercase tracking-widest opacity-40">
                    Las acciones mostradas dependen de tu rol ({user?.role}).
                </p>
            </div>

            {/* Modals */}
            <Modal
                isOpen={activeModal === 'team'}
                onClose={() => setActiveModal(null)}
                title="Crear Nuevo Equipo"
            >
                <CreateTeamForm
                    onSuccess={() => {
                        setActiveModal(null);
                        success('Equipo creado exitosamente');
                    }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'player'}
                onClose={() => setActiveModal(null)}
                title="Inscribir Jugador"
            >
                <CreateUserForm
                    role="PLAYER"
                    onSuccess={() => {
                        setActiveModal(null);
                        success('Jugador inscrito exitosamente');
                    }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'referee'}
                onClose={() => setActiveModal(null)}
                title="Crear Árbitro"
            >
                <CreateUserForm
                    role="REFEREE"
                    onSuccess={() => {
                        setActiveModal(null);
                        success('Árbitro creado exitosamente');
                    }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'tournament'}
                onClose={() => setActiveModal(null)}
                title="Crear Nuevo Torneo"
            >
                <CreateTournamentForm
                    onSuccess={() => {
                        setActiveModal(null);
                        success('Torneo creado exitosamente');
                    }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'coach'}
                onClose={() => setActiveModal(null)}
                title="Crear Director Técnico"
            >
                <CreateUserForm
                    role="COACH"
                    onSuccess={() => {
                        setActiveModal(null);
                        success('DT creado exitosamente');
                    }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'president'}
                onClose={() => setActiveModal(null)}
                title="Crear Presidente"
            >
                <CreateUserForm
                    role="PRESIDENT"
                    onSuccess={() => {
                        setActiveModal(null);
                        success('Presidente creado exitosamente');
                    }}
                    onCancel={() => setActiveModal(null)}
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'group'}
                onClose={() => setActiveModal(null)}
                title="Gestionar Grupos"
            >
                <EntityManager
                    endpoint="/groups"
                    title="Grupos"
                    placeholder="Nombre del nuevo grupo..."
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'category'}
                onClose={() => setActiveModal(null)}
                title="Gestionar Categorías"
            >
                <EntityManager
                    endpoint="/categories"
                    title="Categorías"
                    placeholder="Ej: Sub-20, Senior..."
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'division'}
                onClose={() => setActiveModal(null)}
                title="Gestionar Divisiones"
            >
                <EntityManager
                    endpoint="/divisions"
                    title="Divisiones"
                    placeholder="Ej: Primera A, Primera B..."
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'city'}
                onClose={() => setActiveModal(null)}
                title="Gestionar Ciudades"
            >
                <EntityManager
                    endpoint="/cities"
                    title="Ciudades"
                    placeholder="Ej: Quilmes..."
                />
            </Modal>

            <Modal
                isOpen={activeModal === 'state'}
                onClose={() => setActiveModal(null)}
                title="Gestionar Provincias"
            >
                <EntityManager
                    endpoint="/states"
                    title="Provincias"
                    placeholder="Ej: Buenos Aires..."
                />
            </Modal>
        </div>
    );
}

function Whistle({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M9 5H2v7l2 2h5V5Z" />
            <path d="M9 14h2l3 6c.3.6 1 .9 1.6.6.6-.3.9-1 .6-1.6L13 13h1a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4" />
            <path d="M22 6.5l-3 3" />
        </svg>
    );
}
