import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { OperacionForm } from './OperacionForm'
import { Plus, Edit, Power, PowerOff } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Operacion = Database['public']['Tables']['operaciones']['Row']

export default function OperacionesList() {
  const { operaciones, prendas, updateOperacion, loading } = useAdmin()

  const [editingOperacion, setEditingOperacion] = useState<Operacion | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleToggleEstado = async (op: Operacion) => {
    const accion = op.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de ${accion} esta operación?`)) return
    
    await updateOperacion({
      id: op.id,
      updates: { activo: !op.activo }
    })
  }

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Operación',
      cell: (op: Operacion) => (
        <span className={`font-medium ${op.activo ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
          {op.nombre}
        </span>
      )
    },
    {
      accessorKey: 'prenda_id',
      header: 'Prenda',
      cell: (op: Operacion) => {
        const prenda = prendas.find(p => p.id === op.prenda_id)
        return prenda ? (
          <span className="text-slate-600 font-medium">
            <span className="text-xs font-mono text-slate-400 mr-1.5">{prenda.codigo}</span>
            {prenda.nombre}
          </span>
        ) : (
          <span className="text-slate-400 italic">Sin asignar</span>
        )
      }
    },
    {
      accessorKey: 'precio_fijo',
      header: 'Precio Fijo',
      cell: (op: Operacion) => (
        <span className="font-bold text-emerald-700">
          ${op.precio_fijo.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'tiempo_estimado_minutos',
      header: 'Tiempo (min)',
      cell: (op: Operacion) =>
        op.tiempo_estimado_minutos ? (
          <span className="text-slate-600">{op.tiempo_estimado_minutos} min</span>
        ) : <span className="text-slate-400">-</span>,
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: (op: Operacion) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          op.activo 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {op.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      cell: (op: Operacion) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingOperacion(op)
              setShowForm(true)
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:ring-2 focus:ring-blue-200 outline-none"
            aria-label={`Editar operación ${op.nombre}`}
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleToggleEstado(op)}
            className={`p-2 rounded-md transition-colors focus:ring-2 outline-none ${
              op.activo 
                ? 'text-amber-600 hover:bg-amber-50 focus:ring-amber-200' 
                : 'text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-200'
            }`}
            aria-label={op.activo ? `Desactivar operación ${op.nombre}` : `Activar operación ${op.nombre}`}
            title={op.activo ? 'Desactivar' : 'Activar'}
          >
            {op.activo ? <PowerOff size={18} /> : <Power size={18} />}
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Catálogo de Operaciones</h2>

        <button
          onClick={() => {
            setEditingOperacion(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium"
          disabled={loading}
        >
          <Plus size={16} />
          Nueva Operación
        </button>
      </div>

      <DataTable columns={columns} data={operaciones} />

      {showForm && (
        <OperacionForm
          operacion={editingOperacion}
          prendas={prendas}
          onClose={() => {
            setShowForm(false)
            setEditingOperacion(null)
          }}
        />
      )}
    </div>
  )
}