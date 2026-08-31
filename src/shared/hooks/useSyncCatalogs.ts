import { useCallback, useEffect, useState } from 'react'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

let isSyncingGlobal = false;

export function useSyncCatalogs() {
  const [isSyncing, setIsSyncing] = useState(isSyncingGlobal)

  const triggerSync = useCallback(async (silent = false) => {
    if (!navigator.onLine || isSyncingGlobal) return;

    isSyncingGlobal = true;
    setIsSyncing(true);

    try {
      // ===============================================
      // 1. SYNC UP (Subir producción y turnos locales)
      // ===============================================
      const [registrosPendientes, turnosPendientes] = await Promise.all([
        db.registros_produccion.where('sync_status').equals('pending').toArray(),
        db.turnos.where('sync_status').equals('pending').toArray()
      ]);

      let itemsSubidos = 0;

      if (registrosPendientes.length > 0) {
        const payloadReg = registrosPendientes.map(r => ({
          cantidad: r.cantidad,
          color_id: r.color_id,
          fecha_trabajo: r.fecha_trabajo,
          local_id: r.local_id,
          lote: r.lote,
          operacion_id: r.operacion_id,
          precio_aplicado: r.precio_aplicado,
          talla: r.talla,
          trabajador_id: r.trabajador_id,
        }));

        // Intento 1: Inserción Masiva
        const { error: bulkError } = await supabase
          .from('registros_produccion')
          .upsert(payloadReg, { onConflict: 'local_id' });

        if (!bulkError) {
          // Éxito masivo
          await db.registros_produccion.bulkUpdate(
            registrosPendientes.map(r => ({ key: r.id!, changes: { sync_status: 'synced' as const } }))
          );
          itemsSubidos += registrosPendientes.length;
        } else {
          // Intento 2: Fallback Inserción Individual (Aislamiento de fallos)
          console.warn('Fallo en sincronización masiva, intentando uno por uno...', bulkError);
          for (const reg of payloadReg) {
            const { error: singleError } = await supabase
              .from('registros_produccion')
              .upsert(reg, { onConflict: 'local_id' });
              
            const localRecord = registrosPendientes.find(r => r.local_id === reg.local_id);
            if (!singleError && localRecord?.id) {
              await db.registros_produccion.update(localRecord.id, { sync_status: 'synced' });
              itemsSubidos++;
            } else if (localRecord?.id) {
              console.error(`Fallo crítico al subir bulto ${reg.local_id}`);
            }
          }
        }
      }

      if (turnosPendientes.length > 0) {
        const payloadTurnos = turnosPendientes.map(t => ({
          estado: t.estado,
          fecha: t.fecha,
          hora_fin: t.hora_fin,
          hora_inicio: t.hora_inicio,
          local_id: t.local_id,
          trabajador_id: t.trabajador_id,
          total_horas: t.total_horas
        }));

        const { error: errTurnos } = await supabase
          .from('turnos')
          .upsert(payloadTurnos, { onConflict: 'local_id' });

        if (!errTurnos) {
          await db.turnos.bulkUpdate(
            turnosPendientes.map(t => ({ key: t.id!, changes: { sync_status: 'synced' as const } }))
          );
          itemsSubidos += turnosPendientes.length;
        }
      }

      if (itemsSubidos > 0 && !silent) {
        toast.success(`${itemsSubidos} registros sincronizados a la nube`);
      }

      // ======================================================
      // 2. SYNC DOWN (Descargar catálogos usando TRANSACCIÓN)
      // ======================================================
      const [resPrendas, resOperaciones, resColores] = await Promise.all([
        supabase.from('prendas').select('*'),
        supabase.from('operaciones').select('*'), 
        supabase.from('colores').select('*')
      ]);

      if (resPrendas.error || resOperaciones.error || resColores.error) {
        throw new Error("Error al descargar catálogos de Supabase");
      }

      await db.transaction('rw', db.prendas, db.operaciones, db.colores, async () => {
        await db.prendas.clear();
        await db.operaciones.clear();
        await db.colores.clear();

        if (resPrendas.data?.length) await db.prendas.bulkPut(resPrendas.data);
        if (resOperaciones.data?.length) await db.operaciones.bulkPut(resOperaciones.data);
        if (resColores.data?.length) await db.colores.bulkPut(resColores.data);
      });

    } catch (error) {
      console.error("Error en sincronización:", error);
      if (!silent) toast.error("Error en sincronización. Reintentando en breve.");
    } finally {
      isSyncingGlobal = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      triggerSync(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [triggerSync]);

  return { isSyncing, triggerSync };
}