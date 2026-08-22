import { useState, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../shared/lib/db' 
import { useAuth } from '../../shared/auth/AuthProvider'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, Tags, Hash, AlertTriangle } from 'lucide-react'

const TALLAS_DISPONIBLES = ['Única', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function RegistroTrabajador() {
  const { session } = useAuth()
  
  // Lectura Offline-First
  const prendas = useLiveQuery(() => db.prendas.toArray())
  const operaciones = useLiveQuery(() => db.operaciones.toArray())
  const colores = useLiveQuery(() => db.colores.toArray())

  const isLoadingCatalogs = prendas === undefined || operaciones === undefined || colores === undefined

  const [prendaId, setPrendaId] = useState('')
  const [operacionId, setOperacionId] = useState('')
  const [colorId, setColorId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [talla, setTalla] = useState('Única')
  const [lote, setLote] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)
  
  const cantidadInputRef = useRef<HTMLInputElement>(null)

  const turnoActivo = useLiveQuery(
    async () => {
      if (!session) return null;
      return await db.turnos
        .where('trabajador_id').equals(session.user.id)
        .filter(t => t.estado === 'abierto')
        .first();
    },
    [session]
  )

  const operacionesFiltradas = useMemo(() => {
    if (!operaciones || !prendaId) return []
    return operaciones.filter(o => String(o.prenda_id) === prendaId)
  }, [operaciones, prendaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !turnoActivo) {
      toast.error("Inicia tu turno para poder registrar.")
      return
    }

    const cantNumerica = Number(cantidad)
    if (!cantidad || isNaN(cantNumerica) || cantNumerica <= 0 || !Number.isInteger(cantNumerica)) {
      toast.error("Ingresa una cantidad de piezas válida (número entero positivo).")
      cantidadInputRef.current?.focus()
      return
    }

    setIsSaving(true)
    try {
      await db.registros_produccion.add({
        local_id: crypto.randomUUID(),
        trabajador_id: session.user.id,
        operacion_id: Number(operacionId),
        color_id: Number(colorId),
        cantidad: cantNumerica, // Seguro
        talla: talla,
        lote: lote.trim().toUpperCase(),
        fecha_trabajo: turnoActivo.fecha,
        sync_status: 'pending',
        created_at: new Date().toISOString()
      })

      toast.success("Bulto guardado localmente", {
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      })
      
      setCantidad('') 
      cantidadInputRef.current?.focus()
    } catch (error) {
      console.error(error)
      toast.error("Error al guardar localmente")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingCatalogs) {
    return (
      <div className="flex flex-col justify-center items-center py-20 text-slate-500">
        <Loader2 className="animate-spin mb-3 text-slate-400" size={32} />
        <span className="text-sm font-medium text-slate-600">Cargando catálogos...</span>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 mt-4 md:mt-8">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">Registro de Producción</h2>
        <p className="text-slate-600 text-sm mt-1">Declara las piezas completadas en tu turno actual.</p>
      </div>

      {!turnoActivo && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 flex gap-3 items-start" role="alert">
           <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} aria-hidden="true" />
           <div>
             <h3 className="text-amber-800 font-semibold text-sm">Turno no iniciado</h3>
             <p className="text-amber-700 text-sm mt-1">Ve a la pestaña "Mis Turnos" para registrar tu entrada antes de comenzar a producir.</p>
           </div>
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className={`space-y-6 ${!turnoActivo ? 'opacity-50 pointer-events-none' : ''}`}
        aria-disabled={!turnoActivo}
      >
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
          <div>
            <label htmlFor="prendaSelect" className="block text-sm font-semibold text-slate-900 mb-1.5">
              1. Prenda a trabajar
            </label>
            <select
              id="prendaSelect"
              value={prendaId}
              onChange={(e) => {
                setPrendaId(e.target.value)
                setOperacionId('') 
              }}
              className="w-full min-h-11 p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 shadow-sm"
              required
            >
              <option value="" disabled>-- Selecciona la prenda --</option>
              {(prendas || []).map(p => (
                <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="operacionSelect" className="block text-sm font-semibold text-slate-900 mb-1.5">
              2. Operación realizada
            </label>
            <select
              id="operacionSelect"
              value={operacionId}
              onChange={(e) => setOperacionId(e.target.value)}
              className="w-full min-h-11 p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
              required
              disabled={!prendaId}
              aria-disabled={!prendaId}
            >
              <option value="" disabled>-- Selecciona la operación --</option>
              {operacionesFiltradas.map(o => (
                <option key={o.id} value={o.id}>{o.nombre} - ${o.precio_fijo.toFixed(2)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="colorSelect" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Color
            </label>
            <select
              id="colorSelect"
              value={colorId}
              onChange={(e) => setColorId(e.target.value)}
              className="w-full min-h-11 p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 shadow-sm"
              required
            >
              <option value="" disabled>-- Selecciona color --</option>
              {(colores || []).map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tallaSelect" className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 mb-1.5">
              <Tags size={14} className="text-slate-500" aria-hidden="true" /> 
              Talla
            </label>
            <select
              id="tallaSelect"
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              className="w-full min-h-11 p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 shadow-sm"
              required
            >
              {TALLAS_DISPONIBLES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
             <label htmlFor="loteInput" className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 mb-1.5">
              <Hash size={14} className="text-slate-500" aria-hidden="true" /> 
              Lote / OP <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              id="loteInput"
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              placeholder="Ej. OP-1042"
              className="w-full min-h-11 p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 uppercase shadow-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label htmlFor="cantidadInput" className="block text-sm font-semibold text-slate-900 mb-2">
            3. Cantidad final del bulto
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              id="cantidadInput"
              ref={cantidadInputRef}
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full sm:w-32 min-h-12 p-3 text-center text-xl font-bold bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-slate-900 shadow-sm"
              placeholder="0"
              required
            />
            <button
              type="submit"
              disabled={isSaving || !turnoActivo}
              className="flex-1 min-h-12 bg-primary text-white font-bold p-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 active:scale-[0.98] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              {isSaving ? 'Guardando...' : 'Registrar Bulto'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}