'use client';

import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowUserButtonProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost';
}

export function FollowUserButton({ userId, size = 'md', className = '', variant = 'solid' }: FollowUserButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const { isFollowing, toggle, isLoading } = useFollow(userId);

  if (!isAuthenticated || user?.id === userId) {
    return null;
  }

  const btnText = isFollowing ? 'Siguiendo' : 'Seguir Jugador';
  const Icon = isFollowing ? UserMinus : UserPlus;

  const baseClasses = "group relative overflow-hidden font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 z-10 border-2";
  const sizeClasses = size === 'sm' ? 'px-4 py-2 text-[10px]' : size === 'lg' ? 'px-8 py-4 text-sm' : 'px-6 py-3 text-xs';
  
  const solidColors = isFollowing
    ? "bg-black text-white border-black hover:bg-zinc-800"
    : "bg-accent-primary text-black border-accent-primary hover:bg-black hover:text-accent-primary";
    
  const outlineColors = isFollowing
    ? "bg-white text-text-secondary border-black hover:border-red-500 hover:text-red-500 hover:bg-red-50"
    : "bg-white text-black border-black hover:bg-black hover:text-accent-primary";

  const variantClasses = variant === 'solid' ? solidColors : outlineColors;

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${isLoading ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:-translate-y-1 active:translate-y-0 active:scale-95'} ${className}`}
    >
      <div className="flex items-center gap-3 relative z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
              <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
              <Icon size={size === 'sm' ? 14 : 18} strokeWidth={isFollowing ? 2.5 : 3} />
            </motion.div>
          )}
        </AnimatePresence>
        <span>{btnText}</span>
      </div>

      {/* Brutalist diagonal hover effect for solid variant */}
      {variant === 'solid' && !isFollowing && (
        <div className="absolute inset-0 bg-black translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-0 ease-in-out"></div>
      )}
    </button>
  );
}
