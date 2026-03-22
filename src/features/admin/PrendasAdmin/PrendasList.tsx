import { useState, useEffect } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { PrendaForm } from './PrendaForm'
import type { Database } from '../../../types/supabase'

type Prenda = Database['public']['Tables']['prendas']['Row']

export default function PrendasList() {
  const { getPrendas, deletePrenda, loading } = useAdmin()

  const [prendas, setPrendas] = useState<Prenda[]>([])
  const [editingPrenda, setEditingPrenda] = useState<Prenda | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const fetchPrendas = async () => {
      const { data } = await getPrendas()
      setPrendas(data ?? [])
    }

    fetchPrendas()
  }, [getPrendas])

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    {
      accessorKey: 'codigo',
      header: 'Código',
    },
    {
      accessorKey: 'activo',
      header: 'Activo',
      cell: ({ row }: { row: { original: Prenda } }) =>
        row.original.activo ? 'Sí' : 'No',
    },
  ]

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta prenda?')) return

    await deletePrenda(id)

    const { data } = await getPrendas()
    setPrendas(data ?? [])
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Prendas</h2>

        <button
          onClick={() => {
            setEditingPrenda(null)
            setShowForm(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          + Nueva Prenda
        </button>
      </div>

      <DataTable
        columns={columns}
        data={prendas}
        onEdit={(prenda: Prenda) => {
          setEditingPrenda(prenda)
          setShowForm(true)
        }}
        onDelete={handleDelete}
      />

      {showForm && (
        <PrendaForm
          prenda={editingPrenda}
          onClose={async () => {
            setShowForm(false)
            setEditingPrenda(null)

            const { data } = await getPrendas()
            setPrendas(data ?? [])
          }}
        />
      )}
    </div>
  )
}