'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, Users, Trophy, Smartphone } from 'lucide-react';
import Link from 'next/link';

/**
 * Premium Sales Landing Page for LigaOS.
 * Showcases the system's capabilities for league owners and administrators.
 */
export default function MarketingPage() {
  const features = [
    {
      icon: <Zap className="text-accent-primary" size={32} />,
      title: "Tiempo Real",
      description: "Notificaciones push y actualizaciones instantáneas para goles y eventos."
    },
    {
      icon: <Shield className="text-accent-primary" size={32} />,
      title: "Seguridad Total",
      description: "Roles definidos para árbitros, entrenadores y administradores."
    },
    {
      icon: <TrendingUp className="text-accent-primary" size={32} />,
      title: "Estadísticas Auto",
      description: "Cálculo automático de tablas de posiciones y estadísticas del jugador."
    },
    {
      icon: <Users className="text-accent-primary" size={32} />,
      title: "Comunidad",
      description: "Perfiles de jugadores, equipos y publicaciones sociales integradas."
    },
    {
      icon: <Trophy className="text-accent-primary" size={32} />,
      title: "Gestión de Premios",
      description: "Módulo completo para trofeos y reconocimientos individuales."
    },
    {
      icon: <Smartphone className="text-accent-primary" size={32} />,
      title: "App PWA",
      description: "Instala LigaOS en tu móvil como una app nativa desde el navegador."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-accent-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="main-container text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <span className="px-4 py-2 rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary text-xs font-black uppercase tracking-[0.2em]">
              LigaOS v2.0 • Producción Lista
            </span>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.9] uppercase">
              PROFESIONALIZA TU<br />
              <span className="text-glow text-accent-primary">LIGA DE FÚTBOL</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-text-secondary font-medium italic">
              La plataforma definitiva para gestionar torneos, equipos y estadísticas en tiempo real. 
              Móvil-primero, rápida y diseñada para vender.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/register" className="bg-accent-primary text-white px-12 py-5 font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl">
              Empezar Ahora
            </Link>
            <Link href="/login" className="bg-black text-white px-12 py-5 font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl">
              Ver Demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-bg-secondary/50 border-y border-border-subtle">
        <div className="main-container px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-10 space-y-4 hover:border-accent-primary/50 transition-all card-shine"
              >
                <div className="mb-6">{f.icon}</div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{f.title}</h3>
                <p className="text-text-secondary text-sm font-medium leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-32 bg-black text-white relative">
        <div className="main-container px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <div className="space-y-2">
            <span className="block text-6xl font-black italic text-accent-primary tracking-tighter">10k+</span>
            <span className="text-xs uppercase font-bold tracking-[0.3em] opacity-40">Jugadores Activos</span>
          </div>
          <div className="space-y-2">
            <span className="block text-6xl font-black italic text-accent-primary tracking-tighter">500+</span>
            <span className="text-xs uppercase font-bold tracking-[0.3em] opacity-40">Ligas Gestionadas</span>
          </div>
          <div className="space-y-2">
            <span className="block text-6xl font-black italic text-accent-primary tracking-tighter">1M+</span>
            <span className="text-xs uppercase font-bold tracking-[0.3em] opacity-40">Notificaciones Enviadas</span>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 bg-accent-primary text-black text-center space-y-12">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter">¿Listo para subir el nivel?</h2>
        <Link href="/register" className="inline-block bg-black text-white px-20 py-8 font-black uppercase tracking-[0.2em] text-lg hover:scale-110 transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,0.3)]">
          Crear mi Liga Gratis
        </Link>
      </section>
      
      <footer className="py-12 bg-bg-primary text-center border-t border-border-subtle">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">© 2026 LigaOS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
