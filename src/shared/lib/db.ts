import Dexie, { type Table } from 'dexie';
import type { Database } from '../../types/supabase';

// 1. Tipos extraídos de Supabase
type Prenda = Database['public']['Tables']['prendas']['Row'];
type Operacion = Database['public']['Tables']['operaciones']['Row'];
type Color = Database['public']['Tables']['colores']['Row'];

// 2. Tipos extendidos para la cola de sincronización local
export type TurnoLocal = Omit<Database['public']['Tables']['turnos']['Row'], 'id'> & {
  id?: number; // Opcional porque Dexie lo auto-genera localmente
  sync_status: 'pending' | 'synced';
};

export type RegistroLocal = Omit<Database['public']['Tables']['registros_produccion']['Row'], 'id'> & {
  id?: number;
  sync_status: 'pending' | 'synced';
};

// 3. Declaración de la base de datos Dexie
export class SewingDatabase extends Dexie {
  // Catálogos (Read-Only)
  prendas!: Table<Prenda, number>;
  operaciones!: Table<Operacion, number>;
  colores!: Table<Color, number>;

  // Producción (Offline-first)
  turnos!: Table<TurnoLocal, number>;
  registros!: Table<RegistroLocal, number>;

  constructor() {
    super('SewingDB');
    
    // Definición de índices. Solo se indexa lo que se usa en cláusulas WHERE o relaciones.
    this.version(1).stores({
      prendas: 'id, activo', // Catálogo fijo
      operaciones: 'id, prenda_id, activo',
      colores: 'id, activo',
      
      // sync_status es crucial para saber qué subir a Supabase cuando vuelva internet
      turnos: '++id, trabajador_id, fecha, estado, sync_status', 
      registros: '++id, trabajador_id, fecha_trabajo, sync_status'
    });
  }
}

export const db = new SewingDatabase();