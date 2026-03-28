'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const steps = [
  {
    title: "Panel de Control",
    content: "Aquí tienes una vista global de tu liga. Resultados en vivo, próximos partidos y estadísticas clave.",
    target: "dashboard-header"
  },
  {
    title: "Gestión de Torneos",
    content: "Crea torneos, define formatos (liga, eliminatoria) y genera el calendario automáticamente.",
    target: "tournaments-nav"
  },
  {
    title: "Equipos y Jugadores",
    content: "Administra las plantillas, revisa documentos de identidad y gestiona las fichas de cada jugador.",
    target: "teams-nav"
  },
  {
    title: "Notificaciones en Vivo",
    content: "Desde el panel del árbitro, cada gol enviará una notificación push a todos los interesados.",
    target: "live-events"
  }
];

export const ProductTour = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show tour only for admins/presidents who haven't seen it
    const hasSeenTour = localStorage.getItem('hasSeenProductTour');
    if (user && ['ADMIN', 'SUPER_ADMIN', 'PRESIDENT'].includes(user.role) && !hasSeenTour) {
      setIsVisible(true);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenProductTour', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center md:items-center p-6 bg-black/60 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9, y: 20 }}
           className="bg-bg-card border-4 border-black w-full max-w-md overflow-hidden shadow-[12px_12px_0px_0px_rgba(204,255,0,1)]"
        >
          {/* Header */}
          <div className="bg-black p-4 flex justify-between items-center">
            <span className="text-accent-primary font-black uppercase tracking-widest text-[10px]">Guía de Inicio Rápido</span>
            <button onClick={handleClose} className="text-white hover:text-accent-primary transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-bg-secondary w-full">
            <motion.div 
              className="h-full bg-accent-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                {steps[currentStep].title}
              </h3>
              <p className="text-text-secondary text-sm font-medium leading-relaxed">
                {steps[currentStep].content}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button 
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-text-secondary font-black uppercase text-xs flex items-center gap-1 disabled:opacity-0 transition-all hover:text-black"
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              <button 
                onClick={handleNext}
                className="bg-black text-white px-8 py-3 font-black uppercase text-xs flex items-center gap-2 hover:bg-accent-primary hover:text-black transition-all"
              >
                {currentStep === steps.length - 1 ? (
                  <>Finalizar <CheckCircle2 size={16} /></>
                ) : (
                  <>Siguiente <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          </div>

          <div className="bg-bg-secondary p-4 text-center">
             <span className="text-[10px] font-black text-text-secondary uppercase">Paso {currentStep + 1} de {steps.length}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
