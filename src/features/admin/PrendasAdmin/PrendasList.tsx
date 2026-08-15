import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { PrendaForm } from './PrendaForm'
import { Plus } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Prenda = Database['public']['Tables']['prendas']['Row']

export default function PrendasList() {
  const { prendas, deletePrenda, loading } = useAdmin()

  const [editingPrenda, setEditingPrenda] = useState<Prenda | null>(null)
  const [showForm, setShowForm] = useState(false)

  const columns = [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: ({ row }: { row: { original: Prenda } }) => (
        <span className="font-mono text-sm font-medium text-slate-600">
          {row.original.codigo}
        </span>
      )
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre de la Prenda',
      cell: ({ row }: { row: { original: Prenda } }) => (
        <span className="font-medium text-slate-800">
          {row.original.nombre}
        </span>
      )
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }: { row: { original: Prenda } }) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          row.original.activo 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-slate-100 text-slate-600'
        }`}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta prenda? Sus operaciones también se eliminarán.')) return
    await deletePrenda(id)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Catálogo de Prendas</h2>

        <button
          onClick={() => {
            setEditingPrenda(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium"
          disabled={loading}
        >
          <Plus size={16} />
          Nueva Prenda
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
          onClose={() => {
            setShowForm(false)
            setEditingPrenda(null)
          }}
        />
      )}
    </div>
  )
}