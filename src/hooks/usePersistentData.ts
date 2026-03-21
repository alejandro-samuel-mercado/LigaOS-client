import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing persistent data with stale-while-revalidate pattern.
 * Loads from localStorage on mount, then fetches from API.
 * 
 * @param cacheKey Unique key for this data in localStorage
 * @param fetchFn Function that returns a promise with the fresh data
 * @param dependencies Dependencies that should trigger a re-fetch (e.g. [id])
 */
const STABLE_EMPTY_ARRAY: any[] = [];

export function usePersistentData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = STABLE_EMPTY_ARRAY
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Track if we've already done the initial load to avoid redundant state updates
  const initialLoadDone = useRef(false);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!window.navigator.onLine);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const loadFromCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
      } catch (e) {
        console.error(`Cache error for ${cacheKey}`, e);
      }
    }
  }, [cacheKey]);

  const refresh = useCallback(async (showLoading = true) => {
    // Determine if we should show loading based on current data
    // We use a ref-like check or just rely on the latest state from the closure (which might be stale, but okay for loading)
    if (showLoading && !initialLoadDone.current) setLoading(true);
    
    try {
      const result = await fetchFnRef.current();
      setData(result);
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      }
      setError(null);
    } catch (err: any) {
      console.error(`Fetch error for ${cacheKey}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      loadFromCache();
      initialLoadDone.current = true;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...dependencies, refresh, loadFromCache]);

  return { 
    data, 
    setData,
    loading, 
    error, 
    refresh, 
    isOffline,
    // Helper to determine if we should show a partial "loading" state even if we have cached data
    isValidating: loading && !!data 
  };
}
