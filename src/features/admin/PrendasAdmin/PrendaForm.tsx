import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import type { Database } from '../../../types/supabase'

type Prenda = Database['public']['Tables']['prendas']['Row']

type Props = {
  prenda?: Prenda | null
  onClose: () => void
}

export function PrendaForm({ prenda, onClose }: Props) {
  const { createPrenda, updatePrenda, loading } = useAdmin()

  const [formData, setFormData] = useState(() => ({
    nombre: prenda?.nombre ?? '',
    codigo: prenda?.codigo ?? '',
    activo: prenda?.activo ?? true,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (prenda?.id) {
        await updatePrenda(prenda.id, formData)
      } else {
        await createPrenda(formData)
      }

      onClose()

    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">

      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">

        <h3 className="text-xl font-bold mb-4">
          {prenda ? 'Editar Prenda' : 'Nueva Prenda'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre
            </label>

            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nombre: e.target.value
                })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Código
            </label>

            <input
              type="text"
              value={formData.codigo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  codigo: e.target.value
                })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="activo"
              type="checkbox"
              checked={formData.activo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  activo: e.target.checked
                })
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
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? 'Guardando...'
                : prenda
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