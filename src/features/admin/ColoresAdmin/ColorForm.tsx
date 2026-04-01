import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import type { Database } from '../../../types/supabase'

type Color = Database['public']['Tables']['colores']['Row']

type Props = {
  color?: Color | null
  onClose: () => void
}

export function ColorForm({ color, onClose }: Props) {
  const { createColor, updateColor, loading } = useAdmin()

  const [formData, setFormData] = useState({
    nombre: color?.nombre ?? '',
    codigo_hex: color?.codigo_hex ?? '#000000',
    activo: color?.activo ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (color?.id) {
        await updateColor(color.id, formData)
      } else {
        await createColor(formData)
      }

      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        
        <h3 className="text-xl font-bold mb-4">
          {color ? 'Editar Color' : 'Nuevo Color'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
              placeholder="Ej. Rojo Pasión"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Código Hexadecimal</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.codigo_hex ?? '#000000'}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_hex: e.target.value })
                }
                className="w-12 h-10 cursor-pointer"
              />
              <span className="font-mono text-gray-600 uppercase">
                {formData.codigo_hex}
              </span>
            </div>
          </div>

          <div className="flex items-center pt-2">
            <input
              id="activo-color"
              type="checkbox"
              checked={formData.activo ?? false}
              onChange={(e) =>
                setFormData({ ...formData, activo: e.target.checked })
              }
              className="rounded text-green-600 focus:ring-green-500"
            />
            <label htmlFor="activo-color" className="ml-2 text-sm font-medium cursor-pointer">
              Activo
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : color ? 'Actualizar' : 'Crear'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}