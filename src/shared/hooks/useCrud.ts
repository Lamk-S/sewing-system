import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../../types/supabase'
import { toast } from 'sonner'

type TableName = keyof Database['public']['Tables']

export function useCrud<T extends TableName>(tableName: T) {
  const queryClient = useQueryClient()
  
  type Row = Database['public']['Tables'][T]['Row']
  type InsertDto = Database['public']['Tables'][T]['Insert']
  type UpdateDto = Database['public']['Tables'][T]['Update']

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from(tableName as any).select('*').order('id', { ascending: false })
      if (error) throw error
      return data as unknown as Row[]
    },
    staleTime: 1000 * 60 * 2
  })

  const addMutation = useMutation({
    mutationFn: async (newItem: InsertDto) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from(tableName as any).insert(newItem).select().single()
      if (error) throw error
      return data as unknown as Row
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] })
      toast.success('Registro añadido exitosamente')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al guardar el registro')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number | string; updates: UpdateDto }) => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Row
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] })
      toast.success('Registro actualizado')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al actualizar')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(tableName as any).delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] })
      toast.success('Registro eliminado')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al eliminar (puede que esté en uso)')
    }
  })

  return {
    data: data ?? [],
    isLoading,
    error,
    refetch,
    create: addMutation.mutate,
    add: addMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: addMutation.isPending,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}