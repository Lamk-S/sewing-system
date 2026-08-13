import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Database } from '../../types/supabase';

type CatalogTable = 'prendas' | 'operaciones' | 'colores';

export function useCrud<T extends CatalogTable>(tableName: T) {
  const queryClient = useQueryClient();
  const queryKey = [tableName];

  type Row = Database['public']['Tables'][T]['Row'];
  type Insert = Database['public']['Tables'][T]['Insert'];
  type Update = Database['public']['Tables'][T]['Update'];

  const { data, isLoading, error, refetch } = useQuery<Row[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });
        
      if (error) throw new Error(error.message);
      return data as unknown as Row[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const createRecord = useMutation({
    mutationFn: async (newItem: Insert) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(newItem as never)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as unknown as Row;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Row[]>(queryKey);
      const optimisticItem = { ...newItem, id: -Math.random() } as unknown as Row;
      queryClient.setQueryData<Row[]>(queryKey, (old) => [...(old || []), optimisticItem]);
      return { previousData };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
      toast.error(`Error al crear: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Update }) => {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates as never)
        .eq('id' as never, id)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as unknown as Row;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Row[]>(queryKey);
      queryClient.setQueryData<Row[]>(queryKey, (old) => 
        old?.map(item => item.id === id ? { ...item, ...updates } : item) as Row[]
      );
      return { previousData };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
      toast.error(`Error al actualizar: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id' as never, id);
        
      if (error) throw new Error(error.message);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Row[]>(queryKey);
      queryClient.setQueryData<Row[]>(queryKey, (old) => old?.filter(item => item.id !== id));
      return { previousData };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
      toast.error(`Error al eliminar: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
    create: createRecord.mutateAsync,
    update: updateRecord.mutateAsync,
    remove: deleteRecord.mutateAsync,
  };
}