'use client';

import { Heart } from 'lucide-react';
import { useFavorite } from '@/hooks/useFavorite';
import { useAuth } from '@/context/AuthContext';

interface FavoriteButtonProps {
  teamId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function FavoriteButton({ teamId, size = 'md', className = '' }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggle, isLoading } = useFavorite(teamId);

  if (!isAuthenticated) return null;

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={isLoading}
      className={`group transition-all duration-200 ${isLoading ? 'opacity-50' : ''} ${className}`}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart
        size={iconSize}
        strokeWidth={2.5}
        className={`transition-all duration-200 ${
          isFavorite
            ? 'fill-red-500 text-red-500'
            : 'text-text-secondary group-hover:text-red-400'
        }`}
      />
    </button>
  );
}
