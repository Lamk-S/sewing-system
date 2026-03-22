import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import type { Database } from '../../../types/supabase'

type Operacion = Database['public']['Tables']['operaciones']['Row']

type Prenda = {
  id: number
  nombre: string
  codigo: string
}

type Props = {
  operacion?: Operacion | null
  prendas: Prenda[]
  onClose: () => void
}

export function OperacionForm({ operacion, prendas, onClose }: Props) {
  const { createOperacion, updateOperacion, loading } = useAdmin()

  const [formData, setFormData] = useState({
    nombre: operacion?.nombre ?? '',
    precio_fijo: operacion?.precio_fijo ?? 0,
    prenda_id: operacion?.prenda_id ?? 0,
    tiempo_estimado_minutos: operacion?.tiempo_estimado_minutos ?? 0,
    activo: operacion?.activo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (operacion?.id) {
        await updateOperacion(operacion.id, formData)
      } else {
        await createOperacion(formData)
      }

      onClose()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">
          {operacion ? 'Editar Operación' : 'Nueva Operación'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre Operación
            </label>

            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prenda</label>

            <select
              value={formData.prenda_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prenda_id: Number(e.target.value),
                })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value={0}>Seleccionar prenda...</option>

              {prendas.map((prenda) => (
                <option key={prenda.id} value={prenda.id}>
                  {prenda.nombre} ({prenda.codigo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Precio Fijo ($)
            </label>

            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.precio_fijo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  precio_fijo: Number(e.target.value),
                })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tiempo Estimado (minutos)
            </label>

            <input
              type="number"
              min="0"
              value={formData.tiempo_estimado_minutos}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tiempo_estimado_minutos: Number(e.target.value),
                })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="activo"
              type="checkbox"
              checked={formData.activo}
              onChange={(e) =>
                setFormData({ ...formData, activo: e.target.checked })
              }
              className="rounded"
            />

            <label htmlFor="activo" className="ml-2 text-sm">
              Activo
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading
                ? 'Guardando...'
                : operacion
                ? 'Actualizar'
                : 'Crear'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}