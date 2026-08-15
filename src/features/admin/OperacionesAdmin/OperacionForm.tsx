import { useState } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { X } from 'lucide-react'
import type { Database } from '../../../types/supabase'

type Operacion = Database['public']['Tables']['operaciones']['Row']
type Prenda = { id: number; nombre: string; codigo: string }

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
        await updateOperacion({ id: operacion.id, updates: formData })
      } else {
        await createOperacion(formData)
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
            {operacion ? 'Editar Operación' : 'Registrar Nueva Operación'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre de la Operación</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
              placeholder="Ej. Pegar mangas, Dobladillo"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prenda Asociada</label>
            <select
              value={formData.prenda_id}
              onChange={(e) => setFormData({ ...formData, prenda_id: Number(e.target.value) })}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
              required
            >
              <option value={0} disabled>-- Selecciona una prenda --</option>
              {prendas.map((prenda) => (
                <option key={prenda.id} value={prenda.id}>
                  {prenda.codigo} - {prenda.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Precio Fijo ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_fijo}
                onChange={(e) => setFormData({ ...formData, precio_fijo: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiempo (min)</label>
              <input
                type="number"
                min="0"
                value={formData.tiempo_estimado_minutos}
                onChange={(e) => setFormData({ ...formData, tiempo_estimado_minutos: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
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
                Operación activa
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
              disabled={loading || formData.prenda_id === 0}
              className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Guardando...' : operacion ? 'Guardar Cambios' : 'Crear Operación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}