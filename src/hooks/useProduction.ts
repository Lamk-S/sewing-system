import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

// Tipos con solo las columnas que usamos
type Prenda = Pick<Tables<'prendas'>, 'id' | 'nombre' | 'codigo'>;

type Operacion = Pick<
  Tables<'operaciones'>,
  'id' | 'prenda_id' | 'nombre' | 'precio_fijo' | 'tiempo_estimado_minutos'
>;

type Color = Pick<Tables<'colores'>, 'id' | 'nombre' | 'codigo_hex'>;

export function useProduction() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);

      const [resPrendas, resOperaciones, resColores] = await Promise.all([
        supabase
          .from('prendas')
          .select('id, nombre, codigo')
          .eq('activo', true),

        supabase
          .from('operaciones')
          .select('id, prenda_id, nombre, precio_fijo, tiempo_estimado_minutos')
          .eq('activo', true),

        supabase
          .from('colores')
          .select('id, nombre, codigo_hex')
          .eq('activo', true),
      ]);

      if (resPrendas.error) console.error(resPrendas.error);
      if (resOperaciones.error) console.error(resOperaciones.error);
      if (resColores.error) console.error(resColores.error);

      if (resPrendas.data) setPrendas(resPrendas.data);
      if (resOperaciones.data) setOperaciones(resOperaciones.data);
      if (resColores.data) setColores(resColores.data);

      setLoading(false);
    };

    cargarDatos();
  }, []);

  return { prendas, operaciones, colores, loading };
}