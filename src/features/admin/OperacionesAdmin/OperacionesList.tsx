import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { DataTable } from '../../../shared/components/ui/DataTable'
import { OperacionForm } from './OperacionForm'
import { supabase } from '../../../shared/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Operacion = Database['public']['Tables']['operaciones']['Row'] & {
  prenda: {
    id: number
    nombre: string
    codigo: string
  } | null
}

type Prenda = {
  id: number
  nombre: string
  codigo: string
}

export default function OperacionesList() {
  const { deleteOperacion, loading: isDeleting } = useAdmin()

  const [editingOperacion, setEditingOperacion] = useState<Operacion | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['operaciones-y-prendas'],
    queryFn: async () => {
      const [opRes, prRes] = await Promise.all([
        supabase.from('operaciones').select('*, prenda:prendas(id, nombre, codigo)').order('nombre'),
        supabase.from('prendas').select('id, nombre, codigo').order('nombre')
      ])

      return {
        operaciones: (opRes.data as unknown as Operacion[]) || [],
        prendas: (prRes.data as unknown as Prenda[]) || []
      }
    }
  })

  const operaciones = data?.operaciones || []
  const prendas = data?.prendas || []

  const columns = [
    {
      accessorKey: 'nombre',
      header: 'Operación',
      cell: (op: Operacion) => (
        <span className="font-medium text-slate-800">{op.nombre}</span>
      )
    },
    {
      accessorKey: 'prenda.nombre',
      header: 'Prenda',
      cell: (op: Operacion) => 
        op.prenda ? (
          <span className="text-slate-600">{op.prenda.nombre} ({op.prenda.codigo})</span>
        ) : (
          <span className="text-slate-400 italic">Sin asignar</span>
        )
    },
    {
      accessorKey: 'precio_fijo',
      header: 'Precio Fijo',
      cell: (op: Operacion) => (
        <span className="font-bold text-slate-700">
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
        ) : '-',
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: (op: Operacion) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          op.activo 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-slate-100 text-slate-600'
        }`}>
          {op.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      cell: (op: Operacion) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingOperacion(op)
              setShowForm(true)
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={async () => {
              if (confirm('¿Estás seguro de eliminar esta operación?')) {
                await deleteOperacion(op.id)
                await refetch()
              }
            }}
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
        <h2 className="text-xl font-bold text-slate-800">Catálogo de Operaciones</h2>

        <button
          onClick={() => {
            setEditingOperacion(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium"
          disabled={isLoading || isDeleting}
        >
          <Plus size={16} />
          Nueva Operación
        </button>
      </div>

      <DataTable
        columns={columns}
        data={operaciones}
      />

      {showForm && (
        <OperacionForm
          operacion={editingOperacion}
          prendas={prendas}
          onClose={async () => {
            setShowForm(false)
            setEditingOperacion(null)
            await refetch()
          }}
        />
      )}
    </div>
  )
}