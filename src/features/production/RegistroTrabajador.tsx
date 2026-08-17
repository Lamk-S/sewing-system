import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Prenda, type Operacion, type Color } from '../../shared/lib/db' // <-- IMPORTAMOS LOS TIPOS
import { supabase } from '../../shared/lib/supabase'
import { useAuth } from '../../shared/auth/AuthProvider'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, Tags, Hash } from 'lucide-react'

const TALLAS_DISPONIBLES = ['Única', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34']

export default function RegistroTrabajador() {
  const { session } = useAuth()
  
  const [prendas, setPrendas] = useState<Prenda[]>([])
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [colores, setColores] = useState<Color[]>([])
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true)

  const [prendaId, setPrendaId] = useState('')
  const [operacionId, setOperacionId] = useState('')
  const [colorId, setColorId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [talla, setTalla] = useState('Única')
  const [lote, setLote] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)

  // Verificar si hay un turno abierto
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

  useEffect(() => {
    const loadCatalogs = async () => {
      const [pRes, oRes, cRes] = await Promise.all([
        supabase.from('prendas').select('*').eq('activo', true),
        supabase.from('operaciones').select('*').eq('activo', true),
        supabase.from('colores').select('*').eq('activo', true)
      ])
      
      if (pRes.data) setPrendas(pRes.data)
      if (oRes.data) setOperaciones(oRes.data)
      if (cRes.data) setColores(cRes.data)
      
      setIsLoadingCatalogs(false)
    }
    loadCatalogs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !turnoActivo) {
      toast.error("Debes iniciar tu turno primero en la pestaña 'Mis Turnos'.")
      return
    }

    if (Number(cantidad) <= 0) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }

    setIsSaving(true)
    try {
      await db.registros_produccion.add({
        local_id: crypto.randomUUID(),
        trabajador_id: session.user.id,
        operacion_id: Number(operacionId),
        color_id: Number(colorId),
        cantidad: Number(cantidad),
        talla: talla,
        lote: lote.trim().toUpperCase(),
        fecha_trabajo: turnoActivo.fecha,
        sync_status: 'pending',
        created_at: new Date().toISOString()
      })

      toast.success("Producción registrada correctamente")
      setCantidad('')
    } catch (error) {
      console.error(error)
      toast.error("Ocurrió un error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  // Filtrar operaciones basadas en la prenda seleccionada
  const operacionesFiltradas = operaciones.filter(o => String(o.prenda_id) === prendaId)

  if (isLoadingCatalogs) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 mt-4 animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Registrar Producción</h2>
        <p className="text-slate-500 text-sm">Añade las piezas completadas a tu registro diario.</p>
      </div>

      {!turnoActivo && (
        <div className="bg-amber-50 border border-amber-200 text-amber
        -800 p-4 rounded-xl mb-6 text-sm font-medium flex gap-3 items-start">
           <span className="text-xl">⚠️</span>
           <p>No tienes un turno iniciado. Ve a la pestaña de "Mis Turnos" para registrar tu hora de entrada antes de añadir producción.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-5 ${!turnoActivo ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Fila 1: Prenda y Operación */}
        <div className="space-y-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">1. Selecciona la Prenda</label>
            <select
              value={prendaId}
              onChange={(e) => {
                setPrendaId(e.target.value)
                setOperacionId('')
              }}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              required
            >
              <option value="" disabled>-- Elige una prenda --</option>
              {prendas.map(p => (
                <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">2. Operación Realizada</label>
            <select
              value={operacionId}
              onChange={(e) => setOperacionId(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:bg-slate-100"
              required
              disabled={!prendaId}
            >
              <option value="" disabled>-- Elige la operación --</option>
              {operacionesFiltradas.map(o => (
                <option key={o.id} value={o.id}>{o.nombre} - ${o.precio_fijo.toFixed(2)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Talla, Color y Lote (Variantes) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Color</label>
            <select
              value={colorId}
              onChange={(e) => setColorId(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              required
            >
              <option value="" disabled>-- Elige --</option>
              {colores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Tags size={14} className="text-slate-400" /> Talla
            </label>
            <select
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              required
            >
              {TALLAS_DISPONIBLES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
             <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Hash size={14} className="text-slate-400" /> Lote / OP (Opcional)
            </label>
            <input
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              placeholder="Ej. OP-1042"
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all uppercase"
            />
            <p className="text-xs text-slate-500 mt-1">Identificador del corte o bloque de producción.</p>
          </div>
        </div>

        {/* Fila 3: Cantidad y Botón */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cantidad de Piezas</label>
          <div className="flex gap-3">
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-32 p-3 text-center text-lg font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="0"
              required
            />
            <button
              type="submit"
              disabled={isSaving || !turnoActivo}
              className="flex-1 bg-primary text-primary-foreground font-bold p-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-[0.98] shadow-sm"
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