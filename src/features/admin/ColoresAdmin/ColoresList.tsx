import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { ColorForm } from './ColorForm'
import { Plus } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Color = Database['public']['Tables']['colores']['Row']

export default function ColoresList() {
  const { colores, deleteColor, loading, refetchColores } = useAdmin()

  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [showForm, setShowForm] = useState(false)

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    {
      accessorKey: 'codigo_hex',
      header: 'Código HEX',
      cell: ({ row }: { row: { original: Color } }) => (
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-md border border-slate-200 shadow-sm"
            style={{ backgroundColor: row.original.codigo_hex ?? '#ccc' }}
          />
          <span className="font-mono text-sm text-slate-600 uppercase">
            {row.original.codigo_hex}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ row }: { row: { original: Color } }) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          row.original.activo 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-slate-100 text-slate-600'
        }`}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ]

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este color?')) return
    await deleteColor(id)
    await refetchColores()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Catálogo de Colores</h2>

        <button
          onClick={() => {
            setEditingColor(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium"
          disabled={loading}
        >
          <Plus size={16} />
          Nuevo Color
        </button>
      </div>

      <DataTable
        columns={columns}
        data={colores}
        onEdit={(color: Color) => {
          setEditingColor(color)
          setShowForm(true)
        }}
        onDelete={handleDelete}
      />

      {showForm && (
        <ColorForm
          color={editingColor}
          onClose={async () => {
            setShowForm(false)
            setEditingColor(null)
            await refetchColores()
          }}
        />
      )}
    </div>
  )
}