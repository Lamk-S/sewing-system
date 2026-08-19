import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { toast } from 'sonner';

export function useSyncCatalogs() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCatalogsDown = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const [prendasRes, operacionesRes, coloresRes] = await Promise.all([
        supabase.from('prendas').select('*').eq('activo', true),
        supabase.from('operaciones').select('*').eq('activo', true),
        supabase.from('colores').select('*').eq('activo', true),
      ]);

      if (prendasRes.error) throw prendasRes.error;
      if (operacionesRes.error) throw operacionesRes.error;
      if (coloresRes.error) throw coloresRes.error;

      await db.transaction('rw', db.prendas, db.operaciones, db.colores, async () => {
        await db.prendas.clear();
        await db.operaciones.clear();
        await db.colores.clear();

        if (prendasRes.data.length > 0) await db.prendas.bulkAdd(prendasRes.data);
        if (operacionesRes.data.length > 0) await db.operaciones.bulkAdd(operacionesRes.data);
        if (coloresRes.data.length > 0) await db.colores.bulkAdd(coloresRes.data);
      });
      
    } catch (error) {
      console.error('Error sincronizando catálogos hacia abajo:', error);
    }
  }, []);

  const syncLogsUp = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      // --- 1. SINCRONIZAR REGISTROS DE PRODUCCIÓN ---
      const pendingLogs = await db.registros_produccion
        .where('sync_status')
        .equals('pending')
        .toArray();

      if (pendingLogs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const payloadLogs = pendingLogs.map(({ id, sync_status, ...rest }) => rest);

        const { error: logsError } = await supabase
          .from('registros_produccion')
          .upsert(payloadLogs, { onConflict: 'local_id' });

        if (logsError) throw logsError;

        const syncedLogIds = pendingLogs.map(log => log.id!);
        await db.transaction('rw', db.registros_produccion, async () => {
          await Promise.all(
            syncedLogIds.map(id => db.registros_produccion.update(id, { sync_status: 'synced' }))
          );
        });
      }

      // --- 2. SINCRONIZAR TURNOS ---
      const pendingTurnos = await db.turnos
        .where('sync_status')
        .equals('pending')
        .toArray();

      if (pendingTurnos.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const payloadTurnos = pendingTurnos.map(({ id, sync_status, ...rest }) => rest);

        const { error: turnosError } = await supabase
          .from('turnos')
          .upsert(payloadTurnos, { onConflict: 'local_id' });

        if (turnosError) throw turnosError;

        const syncedTurnoIds = pendingTurnos.map(turno => turno.id!);
        await db.transaction('rw', db.turnos, async () => {
          await Promise.all(
            syncedTurnoIds.map(id => db.turnos.update(id, { sync_status: 'synced' }))
          );
        });
      }

      if (pendingLogs.length > 0 || pendingTurnos.length > 0) {
        toast.success(`Sincronización completada: ${pendingLogs.length} bultos, ${pendingTurnos.length} eventos de turno.`);
      }

    } catch (error) {
      console.error('Error subiendo registros de producción y turnos:', error);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    await syncCatalogsDown();
    await syncLogsUp();
    setIsSyncing(false);
  }, [syncCatalogsDown, syncLogsUp]);

  useEffect(() => {
    triggerSync();
    window.addEventListener('online', triggerSync);
    return () => window.removeEventListener('online', triggerSync);
  }, [triggerSync]);

  return { isSyncing, triggerSync, syncCatalogsDown, syncLogsUp };
}