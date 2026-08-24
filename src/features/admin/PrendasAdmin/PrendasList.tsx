import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { PrendaForm } from './PrendaForm'
import { Plus, Edit, Power, PowerOff } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Prenda = Database['public']['Tables']['prendas']['Row']

export default function PrendasList() {
  const { prendas, updatePrenda, loading } = useAdmin()

  const [editingPrenda, setEditingPrenda] = useState<Prenda | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleToggleEstado = async (prenda: Prenda) => {
    const accion = prenda.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de ${accion} esta prenda?`)) return
    
    await updatePrenda({ 
      id: prenda.id, 
      updates: { activo: !prenda.activo } 
    })
  }

  const columns = [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: (prenda: Prenda) => (
        <span className="font-mono text-sm font-bold text-slate-700">
          {prenda.codigo}
        </span>
      )
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre de la Prenda',
      cell: (prenda: Prenda) => (
        <span className={`font-medium ${prenda.activo ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
          {prenda.nombre}
        </span>
      )
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: (prenda: Prenda) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          prenda.activo 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {prenda.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      cell: (prenda: Prenda) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingPrenda(prenda)
              setShowForm(true)
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:ring-2 focus:ring-blue-200 outline-none"
            aria-label={`Editar prenda ${prenda.codigo}`}
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleToggleEstado(prenda)}
            className={`p-2 rounded-md transition-colors focus:ring-2 outline-none ${
              prenda.activo 
                ? 'text-amber-600 hover:bg-amber-50 focus:ring-amber-200' 
                : 'text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-200'
            }`}
            aria-label={prenda.activo ? `Desactivar prenda ${prenda.codigo}` : `Activar prenda ${prenda.codigo}`}
            title={prenda.activo ? 'Desactivar (Ocultar en producción)' : 'Activar (Mostrar en producción)'}
          >
            {prenda.activo ? <PowerOff size={18} /> : <Power size={18} />}
          </button>
        </div>
      )
    }
  ]

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

      <DataTable columns={columns} data={prendas} />

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