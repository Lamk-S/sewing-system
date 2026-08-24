import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { ColorForm } from './ColorForm'
import { Plus, Edit, Power, PowerOff } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Color = Database['public']['Tables']['colores']['Row']

export default function ColoresList() {
  const { colores, updateColor, loading } = useAdmin()

  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleToggleEstado = async (color: Color) => {
    const accion = color.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de ${accion} este color?`)) return
    
    await updateColor({ 
      id: color.id, 
      updates: { activo: !color.activo } 
    })
  }

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: (color: Color) => (
        <span className={`font-medium ${color.activo ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
          {color.nombre}
        </span>
      )
    },
    {
      accessorKey: 'codigo_hex',
      header: 'Código HEX',
      cell: (color: Color) => (
        <div className="flex items-center gap-2.5">
          <div
            className={`w-5 h-5 rounded border shadow-sm ${color.activo ? 'border-slate-300' : 'border-slate-200 opacity-50'}`}
            style={{ backgroundColor: color.codigo_hex || '#e2e8f0' }}
            aria-hidden="true"
          />
          <span className="font-mono text-sm text-slate-500 uppercase">
            {color.codigo_hex || 'N/A'}
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
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {color.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      cell: (color: Color) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingColor(color)
              setShowForm(true)
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:ring-2 focus:ring-blue-200 outline-none"
            aria-label={`Editar color ${color.nombre}`}
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleToggleEstado(color)}
            className={`p-2 rounded-md transition-colors focus:ring-2 outline-none ${
              color.activo 
                ? 'text-amber-600 hover:bg-amber-50 focus:ring-amber-200' 
                : 'text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-200'
            }`}
            aria-label={color.activo ? `Desactivar color ${color.nombre}` : `Activar color ${color.nombre}`}
            title={color.activo ? 'Desactivar' : 'Activar'}
          >
            {color.activo ? <PowerOff size={18} /> : <Power size={18} />}
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

      <DataTable columns={columns} data={colores} />

      {showForm && (
        <ColorForm
          color={editingColor}
          onClose={() => {
            setShowForm(false)
            setEditingColor(null)
          }}
        />
      )}
    </div>
  )
}