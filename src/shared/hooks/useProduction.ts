import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../../types/supabase'

// Tipos con solo las columnas que usamos
type Prenda = Pick<Tables<'prendas'>, 'id' | 'nombre' | 'codigo'>
type Operacion = Pick<
  Tables<'operaciones'>,
  'id' | 'prenda_id' | 'nombre' | 'precio_fijo' | 'tiempo_estimado_minutos'
>
type Color = Pick<Tables<'colores'>, 'id' | 'nombre' | 'codigo_hex'>

async function fetchPrendas(): Promise<Prenda[]> {
  const { data, error } = await supabase
    .from('prendas')
    .select('id, nombre, codigo')
    .eq('activo', true)

  if (error) throw error
  return data
}

async function fetchOperaciones(): Promise<Operacion[]> {
  const { data, error } = await supabase
    .from('operaciones')
    .select('id, prenda_id, nombre, precio_fijo, tiempo_estimado_minutos')
    .eq('activo', true)

  if (error) throw error
  return data
}

async function fetchColores(): Promise<Color[]> {
  const { data, error } = await supabase
    .from('colores')
    .select('id, nombre, codigo_hex')
    .eq('activo', true)

  if (error) throw error
    return data
}

export function useProduction() {
  const prendasQuery = useQuery<Prenda[], Error>({
    queryKey: ['prendas'],
    queryFn: fetchPrendas,
  })

  const operacionesQuery = useQuery<Operacion[], Error>({
    queryKey: ['operaciones'],
    queryFn: fetchOperaciones,
  })

  const coloresQuery = useQuery<Color[], Error>({
    queryKey: ['colores'],
    queryFn: fetchColores,
  })

  return {
    prendas: prendasQuery.data ?? [],
    operaciones: operacionesQuery.data ?? [],
    colores: coloresQuery.data ?? [],
    loading: prendasQuery.isLoading || operacionesQuery.isLoading || coloresQuery.isLoading,
    error: prendasQuery.error || operacionesQuery.error || coloresQuery.error,
    refetch: () => {
      prendasQuery.refetch()
      operacionesQuery.refetch()
      coloresQuery.refetch()
    },
  }
}