import { useState, useEffect } from 'react'
import { useAdmin } from '../../../shared/hooks/useAdmin'
import { supabase } from '../../../shared/lib/supabase'
import { X, Wand2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../../../types/supabase'

type Prenda = Database['public']['Tables']['prendas']['Row']

type Props = {
  prenda?: Prenda | null
  onClose: () => void
}

export function PrendaForm({ prenda, onClose }: Props) {
  const { createPrenda, updatePrenda } = useAdmin()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState(() => ({
    nombre: prenda?.nombre ?? '',
    codigo: prenda?.codigo ?? '',
    activo: prenda?.activo ?? true,
  }))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAutoGenerateCode = async () => {
    if (!formData.nombre || formData.nombre.trim().length < 3) {
      toast.warning("Escribe al menos 3 letras en el nombre para generar un código.")
      return
    }

    setIsGenerating(true)
    try {
      const prefijo = formData.nombre.replace(/\s+/g, '').substring(0, 3).toUpperCase()

      const { data, error } = await supabase
        .from('prendas')
        .select('codigo')
        .ilike('codigo', `${prefijo}-%`)
        .order('codigo', { ascending: false })
        .limit(1)

      if (error) throw error

      let nextNum = 1
      if (data && data.length > 0) {
        const currentMax = data[0].codigo.split('-')[1]
        if (currentMax && !isNaN(Number(currentMax))) {
          nextNum = Number(currentMax) + 1
        }
      }

      const formattedNum = nextNum.toString().padStart(3, '0')
      const nuevoCodigo = `${prefijo}-${formattedNum}`

      setFormData(prev => ({ ...prev, codigo: nuevoCodigo }))
      toast.success("Código generado automáticamente")
    } catch (error) {
      console.error("Error generando código:", error)
      toast.error("No se pudo generar el código. Verifica tu conexión.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.codigo.trim()) {
      toast.error("El código es obligatorio.")
      return
    }

    setIsSubmitting(true)
    try {
      const dataToSave = {
        ...formData,
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim().toUpperCase()
      }

      if (prenda?.id) {
        await updatePrenda({ id: prenda.id, updates: dataToSave })
        toast.success("Prenda actualizada exitosamente")
      } else {
        await createPrenda(dataToSave)
        toast.success("Prenda registrada exitosamente")
      }
      onClose()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : "Error al guardar. Es posible que el código ya exista."
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
            {prenda ? 'Editar Prenda' : 'Registrar Nueva Prenda'}
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
            <label htmlFor="prendaNombre" className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre descriptivo de la prenda</label>
            <input
              id="prendaNombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all"
              placeholder="Ej. Polo Básico M/C"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="prendaCodigo" className="block text-sm font-semibold text-slate-700 mb-1.5">Código Único</label>
            <div className="flex gap-2">
              <input
                id="prendaCodigo"
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 transition-all font-mono uppercase bg-slate-50 focus:bg-white"
                placeholder="Ej. POL-001"
                required
              />
              <button
                type="button"
                onClick={handleAutoGenerateCode}
                disabled={isGenerating || formData.nombre.trim().length < 3}
                className="px-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary"
                title="Generar código inteligente basado en el nombre"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin text-slate-500" /> : <Wand2 size={16} className="text-amber-600" />}
                Generar
              </button>
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
                Prenda activa (visible para producción)
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
              className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Guardando...' : prenda ? 'Guardar Cambios' : 'Crear Prenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}