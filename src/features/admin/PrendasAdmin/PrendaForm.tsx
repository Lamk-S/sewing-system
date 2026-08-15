import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { X } from 'lucide-react'
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
      const dataToSave = {
        ...formData,
        codigo: formData.codigo.trim().toUpperCase()
      }

      if (prenda?.id) {
        await updatePrenda({ id: prenda.id, updates: dataToSave })
      } else {
        await createPrenda(dataToSave)
      }
      onClose()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {prenda ? 'Editar Prenda' : 'Registrar Nueva Prenda'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Código</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all font-mono uppercase"
                placeholder="Ej. P01"
                required
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre descriptivo</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
                placeholder="Ej. Polo Básico M/C"
                required
              />
            </div>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-all"
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                Prenda activa
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
              {loading ? 'Guardando...' : prenda ? 'Guardar Cambios' : 'Crear Prenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}