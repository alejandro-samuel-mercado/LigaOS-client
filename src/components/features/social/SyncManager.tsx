'use client';

import { useEffect, useState } from 'react';
import { offlineQueue } from '@/adapters/offlineQueue';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';

export function SyncManager() {
  const { showAlert } = useAlert();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      const count = offlineQueue.getQueueLength();
      if (count > 0) {
        setIsSyncing(true);
        showAlert('info', 'Conexión recuperada. Sincronizando acciones pendientes...');
        
        try {
          await offlineQueue.sync(api);
          showAlert('success', 'Sincronización completada con éxito.');
        } catch (error) {
          showAlert('error', 'Error al sincronizar algunas acciones. Se reintentará más tarde.');
        } finally {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Initial sync check
    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [showAlert]);

  return null; // This component has no UI, just logic
}
