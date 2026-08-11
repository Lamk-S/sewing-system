import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export function useProduction() {
  // useLiveQuery escucha cambios en Dexie y re-renderiza automáticamente.
  // Es 100% offline y la respuesta es de 0ms.
  
  const prendas = useLiveQuery(() => db.prendas.toArray(), []) ?? [];
  const operaciones = useLiveQuery(() => db.operaciones.toArray(), []) ?? [];
  const colores = useLiveQuery(() => db.colores.toArray(), []) ?? [];

  // Si useLiveQuery devuelve undefined, significa que Dexie aún está inicializando
  // (Ocurre durante unos pocos milisegundos en el primer montaje)
  const loading = prendas === undefined || operaciones === undefined || colores === undefined;

  return {
    prendas,
    operaciones,
    colores,
    loading,
    error: null, // Los errores de lectura local son prácticamente inexistentes en Dexie
    refetch: () => {
      // Función mantenida intencionalmente vacía por compatibilidad de firma.
      // Dexie reactivo (useLiveQuery) no necesita refetch manual.
    },
  };
}