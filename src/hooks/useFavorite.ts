'use client';

import { useCallback, useEffect, useState } from 'react';
import { favoritesService } from '@/services/api';
import type { FavoriteTeam } from '@/types';
import { useAuth } from '@/context/AuthContext';

export function useFavorite(teamId: string) {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !teamId) return;
    let cancelled = false;

    favoritesService.checkFavorite(teamId).then((result) => {
      if (!cancelled) setIsFavorite(result);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [isAuthenticated, teamId]);

  const toggle = useCallback(async () => {
    if (!isAuthenticated || isLoading) return;
    setIsLoading(true);
    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(teamId);
        setIsFavorite(false);
      } else {
        await favoritesService.addFavorite(teamId);
        setIsFavorite(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isFavorite, isLoading, teamId]);

  return { isFavorite, toggle, isLoading };
}

export function useFavoriteTeams() {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await favoritesService.getMyFavorites();
      setFavorites(result);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { favorites, isLoading, refresh };
}
