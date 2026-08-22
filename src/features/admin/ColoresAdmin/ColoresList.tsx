import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { ColorForm } from './ColorForm'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Color = Database['public']['Tables']['colores']['Row']

export default function ColoresList() {
  const { colores, deleteColor, loading, refetchColores } = useAdmin()

  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este color?')) return
    await deleteColor(id)
    await refetchColores()
  }

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
    },
    {
      accessorKey: 'codigo_hex',
      header: 'Código HEX',
      cell: (color: Color) => (
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-md border border-slate-200 shadow-sm"
            style={{ backgroundColor: color.codigo_hex ?? '#ccc' }}
          />
          <span className="font-mono text-sm text-slate-600 uppercase">
            {color.codigo_hex}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: (color: Color) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          color.activo 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-slate-100 text-slate-600'
        }`}>
          {color.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      cell: (color: Color) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingColor(color)
              setShowForm(true)
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(color.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

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