import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

export function useSyncCatalogs() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCatalogs = async () => {
    // Si no hay red, no se intenta sincronizar
    if (!navigator.onLine) return;

    setIsSyncing(true);
    try {
      // 1. Descargar todo de Supabase (Solo activos)
      const [prendasRes, operacionesRes, coloresRes] = await Promise.all([
        supabase.from('prendas').select('*').eq('activo', true),
        supabase.from('operaciones').select('*').eq('activo', true),
        supabase.from('colores').select('*').eq('activo', true),
      ]);

      if (prendasRes.error) throw prendasRes.error;
      if (operacionesRes.error) throw operacionesRes.error;
      if (coloresRes.error) throw coloresRes.error;

      // 2. Transacción local: Se limpia lo viejo y se inserta lo nuevo
      // Esto asegura que la DB local sea un reflejo exacto del servidor
      await db.transaction('rw', db.prendas, db.operaciones, db.colores, async () => {
        await db.prendas.clear();
        await db.operaciones.clear();
        await db.colores.clear();

        if (prendasRes.data.length > 0) await db.prendas.bulkPut(prendasRes.data);
        if (operacionesRes.data.length > 0) await db.operaciones.bulkPut(operacionesRes.data);
        if (coloresRes.data.length > 0) await db.colores.bulkPut(coloresRes.data);
      });

    } catch (error) {
      console.error('Error sincronizando catálogos:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Sincronizar al montar el hook
    syncCatalogs();

    // Sincronizar automáticamente cuando el dispositivo recupere la conexión
    window.addEventListener('online', syncCatalogs);
    
    return () => {
      window.removeEventListener('online', syncCatalogs);
    };
  }, []);

  return { isSyncing, syncCatalogs };
}