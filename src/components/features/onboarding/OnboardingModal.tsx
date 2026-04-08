'use client';

import { americasLocations } from '@/constants/locations';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useScope } from '@/context/ScopeContext';
import { ArrowRight, LogIn, MapPin, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function OnboardingModal() {
  const { location, setLocation, isLoaded } = useLocation();
  const { scopeLevel, isLoaded: isScopeLoaded } = useScope();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // view: 'welcome' | 'location'
  const [view, setView] = useState<'welcome' | 'location'>('welcome');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  
  // Skip welcome view if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      setView('location');
    }
  }, [user, authLoading]);

  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Don't render anything until contexts are loaded or if location is already set
  // Also hide on auth pages so users can login without the modal blocking them
  if (!isLoaded || !isScopeLoaded || authLoading || location.state || isAuthPage || user?.role === 'SUPER_ADMIN' || scopeLevel !== 'GLOBAL') {
    return null;
  }

  const handleLocationSelect = () => {
    if (selectedCountry && selectedState) {
      setLocation({ country: selectedCountry, state: selectedState });
      // Reload to apply filters globally, but preserving current path
      window.location.reload();
    }
  };

  const currentCountryObj = americasLocations.find(c => c.country === selectedCountry);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 font-mono">
      <div className="bg-bg-card border-4 border-accent-primary max-w-lg w-full p-8 shadow-[12px_12px_0px_rgba(204,255,0,0.3)] animate-in fade-in slide-in-from-bottom-8">
        
        {view === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-accent-primary text-black flex items-center justify-center rounded-2xl transform -rotate-6">
              <span className="text-3xl font-black italic tracking-tighter">L<span className="text-white">OS</span></span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-wide">¡Bienvenido a LigaOS!</h2>
              <p className="text-sm text-text-secondary">El primer sistema operativo para tu liga de fútbol. Para continuar, elige cómo quieres ingresar.</p>
            </div>

            <div className="w-full space-y-4 pt-4">
              <button 
                onClick={() => router.push('/login')}
                className="w-full relative group bg-accent-primary text-white font-black uppercase tracking-widest py-4 px-6 overflow-hidden transition-all duration-300 hover:scale-[1.02]  hover:text-black hover:cursor-pointer"
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <LogIn size={20} />
                  <span>Iniciar Sesión</span>
                </div>
              </button>

              <button 
                onClick={() => setView('location')}
                className="w-full bg-bg-secondary text-text-ptimary hover:text-white border-2 border-text-secondary font-bold uppercase tracking-widest py-4 px-6 transition-all duration-300 hover:border-white hover:bg-black hover:cursor-pointer"
              >
                <div className="flex items-center justify-center gap-3">
                  <User size={20} />
                  <span>Continuar sin usuario</span>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-text-tertiary">Podrás crear un usuario o iniciar sesión más tarde.</p>
          </div>
        )}

        {view === 'location' && (
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 bg-bg-secondary border-2 border-accent-primary text-accent-primary flex items-center justify-center rounded-full mb-2">
                <MapPin size={30} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-wide">Tu Ubicación</h2>
              <p className="text-sm text-text-secondary">Configura el filtro global. Solo verás torneos y equipos de la provincia seleccionada.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-text-secondary">Selecciona tu País</label>
                <select 
                  className="w-full bg-black border-2 border-text-secondary text-white p-3 font-bold focus:border-accent-primary outline-none transition-colors"
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState(''); // Reset state when country changes
                  }}
                >
                  <option value="" disabled>-- Elige un país --</option>
                  {americasLocations.map(loc => (
                    <option key={loc.country} value={loc.country}>{loc.country}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-text-secondary">Selecciona tu Provincia/Estado</label>
                <select 
                  className="w-full bg-black border-2 border-text-secondary text-white p-3 font-bold focus:border-accent-primary outline-none transition-colors disabled:opacity-50"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  disabled={!selectedCountry}
                >
                  <option value="" disabled>-- Elige una provincia --</option>
                  {currentCountryObj?.states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleLocationSelect}
                disabled={!selectedCountry || !selectedState}
                className="w-full flex items-center justify-center gap-2 bg-accent-primary text-black font-black uppercase tracking-widest py-4 px-6 mt-4 disabled:opacity-50 transition-transform active:scale-95"
              >
                <span>Acceder a LigaOS</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
