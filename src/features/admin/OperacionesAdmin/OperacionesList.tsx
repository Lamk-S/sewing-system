import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { OperacionForm } from './OperacionForm'
import { supabase } from '../../../shared/lib/supabase'
import type { Database } from '../../../types/supabase'

type Operacion = Database['public']['Tables']['operaciones']['Row'] & {
  prenda: {
    id: number
    nombre: string
    codigo: string
  }
}

type Prenda = {
  id: number
  nombre: string
  codigo: string
}

export default function OperacionesList() {

  const { getOperaciones, deleteOperacion, loading } = useAdmin()

  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [editingOperacion, setEditingOperacion] = useState<Operacion | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [prendas, setPrendas] = useState<Prenda[]>([])

  const fetchOperaciones = useCallback(async () => {
    const { data } = await getOperaciones()
    setOperaciones((data as Operacion[]) || [])
  }, [getOperaciones])

  const fetchPrendas = useCallback(async () => {
    const { data } = await supabase
      .from('prendas')
      .select('id, nombre, codigo')
      .order('nombre')

    setPrendas(data || [])
  }, [])

  useEffect(() => {
    const init = async () => {
      await fetchOperaciones()
      await fetchPrendas()
    }

    init()
  }, [fetchOperaciones, fetchPrendas])

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Operación',
    },
    {
      accessorKey: 'prenda.nombre',
      header: 'Prenda',
    },
    {
      accessorKey: 'precio_fijo',
      header: 'Precio Fijo',
      cell: ({ row }: { row: { original: Operacion } }) =>
        `$${row.original.precio_fijo.toFixed(2)}`,
    },
    {
      accessorKey: 'tiempo_estimado_minutos',
      header: 'Tiempo (min)',
      cell: ({ row }: { row: { original: Operacion } }) =>
        row.original.tiempo_estimado_minutos || '-',
    },
  ]

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Operaciones</h2>

        <button
          onClick={() => {
            setEditingOperacion(null)
            setShowForm(true)
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          disabled={loading}
        >
          + Nueva Operación
        </button>
      </div>

      <DataTable
        columns={columns}
        data={operaciones}

        onEdit={(op: Operacion) => {
          setEditingOperacion(op)
          setShowForm(true)
        }}

        onDelete={async (id: number) => {
          if (confirm('¿Estás seguro de eliminar esta operación?')) {
            await deleteOperacion(id)
            await fetchOperaciones()
          }
        }}
      />

      {showForm && (
        <OperacionForm
          operacion={editingOperacion}
          prendas={prendas}
          onClose={() => {
            setShowForm(false)
            setEditingOperacion(null)
            fetchOperaciones()
          }}
        />
      )}

    </div>
  )
}