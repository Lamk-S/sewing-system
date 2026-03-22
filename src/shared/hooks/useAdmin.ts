import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../../types/supabase'

export const useAdmin = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiCall = useCallback(async <T>(fn: () => PromiseLike<T>) => {
    setLoading(true)
    setError(null)

    try {
      const result = await fn()
      return result
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error desconocido')
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getPrendas = () =>
    apiCall(() =>
      supabase
        .from('prendas')
        .select('*')
        .order('nombre')
    )

  const getColores = () =>
    apiCall(() =>
      supabase
        .from('colores')
        .select('*')
        .order('nombre')
    )

  const getOperaciones = () =>
    apiCall(() =>
      supabase
        .from('operaciones')
        .select(`
          *,
          prenda:prendas!prenda_id (id, nombre, codigo)
        `)
        .order('nombre')
    )

  const createPrenda = (
    data: Database['public']['Tables']['prendas']['Insert']
  ) =>
    apiCall(() =>
      supabase
        .from('prendas')
        .insert(data)
        .select()
        .single()
    )

  const updatePrenda = (
    id: number,
    data: Database['public']['Tables']['prendas']['Update']
  ) =>
    apiCall(() =>
      supabase
        .from('prendas')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    )

  const deletePrenda = (id: number) =>
    apiCall(() =>
      supabase
        .from('prendas')
        .delete()
        .eq('id', id)
    )

  const createColor = (
    data: Database['public']['Tables']['colores']['Insert']
  ) =>
    apiCall(() =>
      supabase
        .from('colores')
        .insert(data)
        .select()
        .single()
    )

  const updateColor = (
    id: number,
    data: Database['public']['Tables']['colores']['Update']
  ) =>
    apiCall(() =>
      supabase
        .from('colores')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    )

  const deleteColor = (id: number) =>
    apiCall(() =>
      supabase
        .from('colores')
        .delete()
        .eq('id', id)
    )

  const createOperacion = (
    data: Database['public']['Tables']['operaciones']['Insert']
  ) =>
    apiCall(() =>
      supabase
        .from('operaciones')
        .insert(data)
        .select()
        .single()
    )

  const updateOperacion = (
    id: number,
    data: Database['public']['Tables']['operaciones']['Update']
  ) =>
    apiCall(() =>
      supabase
        .from('operaciones')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    )

  const deleteOperacion = (id: number) =>
    apiCall(() =>
      supabase
        .from('operaciones')
        .delete()
        .eq('id', id)
    )

  return {
    loading,
    error,
    getPrendas,
    getColores,
    getOperaciones,
    createPrenda,
    updatePrenda,
    deletePrenda,
    createColor,
    updateColor,
    deleteColor,
    createOperacion,
    updateOperacion,
    deleteOperacion,
  }
}