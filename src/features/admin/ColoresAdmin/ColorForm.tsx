import { useState, useEffect } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../../../types/supabase'

type Color = Database['public']['Tables']['colores']['Row']

type Props = {
  color?: Color | null
  onClose: () => void
}

export function ColorForm({ color, onClose }: Props) {
  const { createColor, updateColor } = useAdmin()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: color?.nombre ?? '',
    codigo_hex: color?.codigo_hex ?? '#000000',
    activo: color?.activo ?? true,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre del color es obligatorio")
      return
    }

    setIsSubmitting(true)
    try {
      if (color?.id) {
        await updateColor({ id: color.id, updates: { ...formData, nombre: formData.nombre.trim() } })
        toast.success("Color actualizado exitosamente")
      } else {
        await createColor({ ...formData, nombre: formData.nombre.trim() })
        toast.success("Color registrado exitosamente")
      }
      onClose()
    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : "Error al guardar el color. Verifica que el nombre no esté duplicado."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h3 id="modal-title" className="text-xl font-bold text-slate-800">
            {color ? 'Editar Color' : 'Registrar Nuevo Color'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label="Cerrar modal"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label htmlFor="colorNombre" className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre descriptivo</label>
            <input
              id="colorNombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
              placeholder="Ej. Azul Marino, Rojo Fuego"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="colorHex" className="block text-sm font-semibold text-slate-700 mb-1.5">Código Hexadecimal</label>
            <div className="flex items-center gap-3 p-2 border border-slate-300 rounded-lg bg-slate-50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
              <input
                type="color"
                value={formData.codigo_hex}
                onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                className="w-10 h-10 p-0 border-0 rounded cursor-pointer shrink-0 bg-transparent"
                aria-label="Selector de color visual"
              />
              <input
                id="colorHex"
                type="text"
                value={formData.codigo_hex}
                onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                className="font-mono uppercase tracking-wide flex-1 bg-transparent border-none outline-none text-slate-700"
                placeholder="#000000"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                title="Debe ser un código hexadecimal válido (ej. #FF0000)"
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
                Color activo y visible para trabajadores
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Guardando...' : color ? 'Guardar Cambios' : 'Crear Color'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}