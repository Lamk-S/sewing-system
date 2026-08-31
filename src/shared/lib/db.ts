import Dexie, { type Table } from 'dexie';
import type { Database } from '../../types/supabase';

export type SyncStatus = 'synced' | 'pending' | 'error';

// 1. Tipos extraídos de Supabase
export type Prenda = Database['public']['Tables']['prendas']['Row'];
export type Operacion = Database['public']['Tables']['operaciones']['Row'];
export type Color = Database['public']['Tables']['colores']['Row'];

// 2. Tipos de producción para uso local
export type RegistroLocal = Omit<Database['public']['Tables']['registros_produccion']['Row'], 'id'> & {
  id?: number; // Auto-incremental de Dexie
  sync_status: SyncStatus;
  talla?: string | null;
  lote?: string | null;
  precio_aplicado: number;
};

export type TurnoLocal = Omit<Database['public']['Tables']['turnos']['Row'], 'id' | 'hora_fin' | 'total_horas' | 'es_anomalo' | 'server_sync_time'> & {
  id?: number; // Auto-incremental de Dexie
  hora_fin?: string | null;
  total_horas?: number | null;
  es_anomalo?: boolean | null;
  server_sync_time?: string | null;
  sync_status: SyncStatus;
};

export class SewingDatabase extends Dexie {
  prendas!: Table<Prenda, number>;
  operaciones!: Table<Operacion, number>;
  colores!: Table<Color, number>;
  registros_produccion!: Table<RegistroLocal, number>;
  turnos!: Table<TurnoLocal, number>;

  constructor() {
    super('SewingDB');
    
    this.version(2).stores({
      prendas: 'id, activo',
      operaciones: 'id, prenda_id, activo',
      colores: 'id, activo',
      registros_produccion: '++id, local_id, trabajador_id, sync_status, fecha_trabajo',
      turnos: '++id, local_id, trabajador_id, fecha, estado, sync_status'
    });

    this.version(3).stores({
      prendas: 'id, activo',
      operaciones: 'id, prenda_id, activo',
      colores: 'id, activo',
      registros_produccion: '++id, &local_id, trabajador_id, sync_status, fecha_trabajo',
      turnos: '++id, &local_id, trabajador_id, fecha, estado, sync_status'
    });

    this.version(4).stores({
      prendas: 'id, activo',
      operaciones: 'id, prenda_id, activo',
      colores: 'id, activo',
      registros_produccion: '++id, &local_id, trabajador_id, sync_status, fecha_trabajo',
      turnos: '++id, &local_id, trabajador_id, fecha, estado, sync_status'
    });
  }
}

export const db = new SewingDatabase();