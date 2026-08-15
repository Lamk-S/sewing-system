import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { X } from 'lucide-react'
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
        await updateColor({ id: color.id, updates: formData })
      } else {
        await createColor(formData)
      }
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {color ? 'Editar Color' : 'Registrar Nuevo Color'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre descriptivo</label>
            <input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
              placeholder="Ej. Azul Marino, Rojo Fuego"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Código Hexadecimal</label>
            <div className="flex items-center gap-3 p-2 border border-slate-300 rounded-lg bg-slate-50">
              <input
                type="color"
                value={formData.codigo_hex ?? '#000000'}
                onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
              />
              <span className="font-mono text-slate-600 uppercase tracking-wide flex-1">
                {formData.codigo_hex}
              </span>
            </div>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.activo ?? false}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-all"
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                Color activo y visible para trabajadores
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Guardando...' : color ? 'Guardar Cambios' : 'Crear Color'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}