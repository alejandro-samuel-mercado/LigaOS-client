/**
 * Wizard de bienvenida por rol.
 * Se muestra UNA SOLA VEZ al usuario después de su primer login,
 * explicándole qué puede hacer según su rol en el sistema.
 * Estado persistido en localStorage.
 */
'use client';

import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Shield, Award, UserCheck, ChevronRight, X, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WIZARD_KEY = 'ligaos_role_wizard_done_v1';

interface WizardStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: { label: string; href: string };
}

function getStepsForRole(role: string, name: string): WizardStep[] {
  const bienvenida: WizardStep = {
    title: `¡Hola, ${name}!`,
    description: 'Bienvenido a LigaOS. En unos pasos te mostramos qué podés hacer desde tu cuenta.',
    icon: <Zap size={36} className="text-accent-primary" />,
  };

  switch (role) {
    case 'PRESIDENT':
      return [
        bienvenida,
        {
          title: 'Creá tu Equipo',
          description: 'Como Presidente podés crear tu club, cargar el escudo, colores y datos. Luego invitá jugadores y un Director Técnico.',
          icon: <Shield size={36} className="text-accent-primary" />,
          action: { label: 'Gestionar Equipo', href: '/management' },
        },
        {
          title: 'Inscribite en Torneos',
          description: 'Una vez que tengas tu equipo armado, podés inscribirlo en los torneos activos de tu provincia.',
          icon: <Award size={36} className="text-accent-primary" />,
          action: { label: 'Ver Torneos', href: '/tournaments' },
        },
      ];

    case 'COACH':
      return [
        bienvenida,
        {
          title: 'Director Técnico',
          description: 'Podés definir la alineación, convocar jugadores para cada partido y modificar el estado deportivo de tu plantel.',
          icon: <UserCheck size={36} className="text-accent-primary" />,
          action: { label: 'Mi Equipo', href: '/my-team' },
        },
        {
          title: 'Antes de cada partido',
          description: 'Entrá al partido, seleccioná los jugadores convocados y definí el equipo titular antes de que arranque.',
          icon: <Clock size={36} className="text-accent-primary" />,
          action: { label: 'Ver Calendario', href: '/matches' },
        },
      ];

    case 'REFEREE':
      return [
        bienvenida,
        {
          title: 'Panel de Árbitro',
          description: 'En "Mis Partidos" vas a ver todos los partidos que tenés asignados. Podés registrar goles, faltas y tarjetas en tiempo real.',
          icon: <Shield size={36} className="text-accent-primary" />,
          action: { label: 'Mis Partidos', href: '/referee' },
        },
        {
          title: 'Registro en tiempo real',
          description: 'Cuando el partido está en juego, todos los usuarios ven el marcador actualizado al instante. El minuto se calcula automáticamente.',
          icon: <Zap size={36} className="text-accent-primary" />,
          action: { label: 'Ver Disponibilidad', href: '/profile' },
        },
      ];

    default:
      return [
        bienvenida,
        {
          title: 'Seguí tu Equipo',
          description: 'Buscá el equipo con el que jugás y seguí sus partidos en vivo, estadísticas y resultados.',
          icon: <Shield size={36} className="text-accent-primary" />,
          action: { label: 'Buscar Equipos', href: '/search?type=teams' },
        },
        {
          title: 'Partidos en Vivo',
          description: 'Seguí cualquier partido con marcador en tiempo real. Cuando hay transmisión, podés ver el video directamente en el partido.',
          icon: <Zap size={36} className="text-accent-primary" />,
          action: { label: 'Ver Partidos', href: '/matches' },
        },
      ];
  }
}

export function WelcomeWizard() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (pathname === '/login' || pathname === '/register') return;
    const done = localStorage.getItem(WIZARD_KEY);
    if (!done) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, user, pathname]);

  const handleClose = () => {
    localStorage.setItem(WIZARD_KEY, '1');
    setShow(false);
  };

  if (!user || !show) return null;

  const steps = getStepsForRole(user.role, user.name);
  const current = steps[step]!;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="w-full max-w-sm bg-bg-card border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
          >
            {/* Barra de progreso superior */}
            <div className="flex gap-0.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 transition-all duration-500 ${i <= step ? 'bg-accent-primary' : 'bg-border-subtle'}`}
                />
              ))}
            </div>

            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-text-secondary/50 hover:text-text-primary transition-colors z-10"
            >
              <X size={16} />
            </button>

            <div className="p-7 space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <div className="h-16 w-16 bg-bg-secondary border-4 border-black flex items-center justify-center">
                    {current.icon}
                  </div>
                  <h2 className="text-xl font-black text-text-primary uppercase italic tracking-tight leading-none pr-6">
                    {current.title}
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-2 pt-1">
                {current.action && !isLast && (
                  <Link
                    href={current.action.href}
                    onClick={handleClose}
                    className="flex-1 text-center py-2.5 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                  >
                    {current.action.label}
                  </Link>
                )}

                {isLast ? (
                  current.action ? (
                    <Link
                      href={current.action.href}
                      onClick={handleClose}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent-primary text-white py-3 font-black uppercase text-[10px] tracking-widest border-b-4 border-black hover:bg-black transition-all"
                    >
                      {current.action.label} <ChevronRight size={12} />
                    </Link>
                  ) : (
                    <button
                      onClick={handleClose}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent-primary text-white py-3 font-black uppercase text-[10px] tracking-widest border-b-4 border-black hover:bg-black transition-all"
                    >
                      Comenzar <ChevronRight size={12} />
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 font-black uppercase text-[10px] tracking-widest hover:bg-accent-primary transition-all"
                  >
                    Siguiente <ChevronRight size={12} />
                  </button>
                )}
              </div>

              <p className="text-center text-[9px] text-text-secondary/30 font-black uppercase tracking-widest">
                {step + 1} de {steps.length}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
