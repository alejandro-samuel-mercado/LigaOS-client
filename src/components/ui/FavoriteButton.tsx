'use client';

import { Heart, ShieldCheck, Shield, Loader2 } from 'lucide-react';
import { useFavorite } from '@/hooks/useFavorite';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoriteButtonProps {
    teamId: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    variant?: 'solid' | 'outline' | 'ghost' | 'heart';
}

export function FavoriteButton({ teamId, size = 'md', className = '', variant = 'solid' }: FavoriteButtonProps) {
    const { isAuthenticated } = useAuth();
    const { isFavorite, toggle, isLoading } = useFavorite(teamId);

    if (!isAuthenticated) return null;

    if (variant === 'heart') {
        const iconSize = size === 'sm' ? 16 : size === 'lg' ? 40 : 20;
        return (
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
                disabled={isLoading}
                className={`group transition-all duration-200 ${isLoading ? 'opacity-50' : ''} ${className}`}
                title={isFavorite ? 'Dejar de seguir equipo' : 'Seguir equipo'}
            >
                <Heart
                    size={iconSize}
                    strokeWidth={2.5}
                    className={`transition-all duration-200 ${isFavorite
                        ? 'fill-red-500 text-red-500'
                        : 'text-text-secondary group-hover:text-red-400'
                        }`}
                />
            </button>
        );
    }

    const baseClasses = "relative overflow-hidden font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 z-10 border-2";
    const sizeClasses = size === 'sm' ? 'px-4 py-2 text-[10px]' : size === 'lg' ? 'px-8 py-4 text-sm' : 'px-6 py-3 text-xs';

    const solidColors = isFavorite 
        ? 'bg-black text-white border-black hover:bg-red-600 hover:border-red-600 hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)]' 
        : 'bg-accent-primary text-black border-accent-primary hover:bg-black hover:text-accent-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]';
    
    const outlineColors = isFavorite
        ? 'bg-white text-text-secondary border-black hover:border-red-500 hover:text-red-500 hover:bg-red-50'
        : 'bg-white text-black border-black hover:bg-black hover:text-accent-primary';

    const variantClasses = variant === 'solid' ? solidColors : outlineColors;
    const Icon = isFavorite ? ShieldCheck : Shield;

    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
            disabled={isLoading}
            className={`${baseClasses} ${sizeClasses} ${variantClasses} ${isLoading ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:-translate-y-1 active:translate-y-0 active:scale-95'} ${className}`}
            title={isFavorite ? 'Dejar de seguir equipo' : 'Seguir equipo'}
        >
            <div className="flex items-center gap-3 relative z-10">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div key="loading" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                            <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />
                        </motion.div>
                    ) : (
                        <motion.div key="icon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                            <Icon size={size === 'sm' ? 14 : 18} strokeWidth={isFavorite ? 2.5 : 3} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <span>{isFavorite ? 'Siguiendo Equipo' : 'Seguir Equipo'}</span>
            </div>

            {/* Brutalist diagonal hover effect for solid variant */}
            {variant === 'solid' && !isFavorite && (
                <div className="absolute inset-0 bg-black translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-0 ease-in-out"></div>
            )}
        </button>
    );
}
