import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../../types/supabase"

// ✅ SOLO tablas reales
type TableName = keyof Database["public"]["Tables"]

export function useCrud<T extends TableName>(table: T) {
  const [data, setData] = useState<Tables<T>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 📥 GET ALL
  const getAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from(table)
      .select("*")

    if (error) {
      setError(error.message)
    } else {
      setData(data as Tables<T>[])
    }

    setLoading(false)
  }, [table])

  // ➕ CREATE
  const create = async (values: TablesInsert<T>) => {
    setLoading(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).insert(values) 

    if (error) setError(error.message)

    await getAll()
    setLoading(false)
  }

  // ✏️ UPDATE
  const update = async (
    id: Tables<T>["id"],
    values: TablesUpdate<T>
  ) => {
    setLoading(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).update(values).eq("id", id)

    if (error) setError(error.message)

    await getAll()
    setLoading(false)
  }

  // ❌ DELETE
  const remove = async (id: Tables<T>["id"]) => {
    setLoading(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).delete().eq("id", id)

    if (error) setError(error.message)

    await getAll()
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getAll()
  }, [getAll])

  return {
    data,
    loading,
    error,
    getAll,
    create,
    update,
    remove,
  }
}