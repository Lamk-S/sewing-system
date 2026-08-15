import { useState, useMemo } from 'react'
import { useProduction } from '../../shared/hooks/useProduction'
import { useAuth } from '../../shared/auth/AuthProvider'
import { toast } from 'sonner'
import { Plus, Minus, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { db, type RegistroLocal } from '../../shared/lib/db'

export default function RegistroTrabajador() {
  const { session } = useAuth()
  const { prendas, operaciones, colores, loading } = useProduction()

  const [prendaSeleccionada, setPrendaSeleccionada] = useState<string>('')
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<string>('')
  // No necesitamos inicializar con un useEffect, un objeto vacío es suficiente y más rápido
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [guardando, setGuardando] = useState(false)

  // Cálculos derivados rápidos
  const operacionesFiltradas = useMemo(() => {
    if (!prendaSeleccionada) return []
    return operaciones.filter(op => op.prenda_id === Number(prendaSeleccionada))
  }, [prendaSeleccionada, operaciones])

  const operacionActiva = useMemo(() => {
    return operaciones.find(o => o.id === Number(operacionSeleccionada))
  }, [operacionSeleccionada, operaciones])

  const totalPiezas = useMemo(() => {
    return Object.values(cantidades).reduce((sum, cant) => sum + cant, 0)
  }, [cantidades])

  const valorTotal = totalPiezas * (operacionActiva?.precio_fijo || 0)

  if (!session) return null
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Cargando catálogo...</p>
      </div>
    )
  }

  const actualizarCantidad = (colorId: number, incremento: number) => {
    setCantidades(prev => {
      const cantidadActual = prev[colorId] || 0
      const nuevaCantidad = Math.max(0, cantidadActual + incremento)
      return { ...prev, [colorId]: nuevaCantidad }
    })
  }

  const guardarRegistro = async () => {
    if (!operacionActiva || totalPiezas === 0) return

    const registrosLocales: RegistroLocal[] = Object.entries(cantidades)
      .filter(([, cant]) => cant > 0)
      .map(([colorId, cantidad]) => ({
        local_id: crypto.randomUUID(),
        operacion_id: operacionActiva.id,
        color_id: Number(colorId),
        cantidad,
        trabajador_id: session.user.id,
        fecha_trabajo: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        sync_status: 'pending'
      }))

    setGuardando(true)
    try {
      await db.registros_produccion.bulkAdd(registrosLocales)
      
      toast.success(`Se guardaron ${totalPiezas} piezas correctamente`, {
        icon: <CheckCircle2 className="text-emerald-600" />
      })
      
      // Resetear formulario
      setCantidades({})
      setOperacionSeleccionada('')
    } catch (error) {
      console.error('Error guardando en Dexie:', error)
      toast.error("Error al guardar producción localmente")
    } finally {
      setGuardando(false)
    }
  }

  const isBotonDeshabilitado = guardando || !operacionSeleccionada || totalPiezas === 0

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-2 md:mt-6">
      
      {/* 1. SELECCIÓN DE PRENDA Y OPERACIÓN */}
      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            1. ¿Qué prenda estás cosiendo?
          </label>
          <select
            className="w-full p-3.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            value={prendaSeleccionada}
            onChange={(e) => { 
              setPrendaSeleccionada(e.target.value)
              setOperacionSeleccionada('') 
            }}
          >
            <option value="">-- Selecciona una Prenda --</option>
            {prendas.map(p => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            2. ¿Qué operación realizaste?
          </label>
          <select
            className="w-full p-3.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50 disabled:bg-slate-100"
            value={operacionSeleccionada}
            onChange={e => setOperacionSeleccionada(e.target.value)}
            disabled={!prendaSeleccionada}
          >
            <option value="">-- Selecciona una Operación --</option>
            {operacionesFiltradas.map(op => (
              <option key={op.id} value={op.id}>{op.nombre} (${op.precio_fijo})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. INGRESO DE CANTIDADES POR COLOR */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          3. Ingresa las cantidades
        </label>
        
        <div className="grid gap-3">
          {colores.map(color => {
            const cantidad = cantidades[color.id] || 0;
            return (
              <div 
                key={color.id} 
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  cantidad > 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full border border-slate-300 shadow-sm" 
                    style={{ backgroundColor: color.codigo_hex || '#ccc' }} 
                  />
                  <span className="font-medium text-slate-700">{color.nombre}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => actualizarCantidad(color.id, -1)} 
                    disabled={cantidad === 0}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                    aria-label="Restar uno"
                  >
                    <Minus size={18} strokeWidth={2.5} />
                  </button>
                  
                  <span className="text-xl font-bold text-slate-900 w-8 text-center tabular-nums">
                    {cantidad}
                  </span>
                  
                  <button 
                    onClick={() => actualizarCantidad(color.id, 1)} 
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                    aria-label="Sumar uno"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. RESUMEN Y ACCIÓN */}
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6 flex justify-between items-center">
        <div>
          <span className="block text-sm text-slate-500 font-medium mb-1">Total de piezas</span>
          <span className="text-2xl font-bold text-slate-900">{totalPiezas}</span>
        </div>
        <div className="text-right">
          <span className="block text-sm text-slate-500 font-medium mb-1">Valor Generado</span>
          <span className="text-2xl font-bold text-emerald-600">${valorTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={guardarRegistro}
        disabled={isBotonDeshabilitado}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex justify-center items-center transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-sm"
      >
        {guardando ? (
          <Loader2 className="animate-spin mr-2" size={20} />
        ) : (
          <Save className="mr-2" size={20} />
        )}
        {guardando ? 'Guardando...' : 'Confirmar Producción'}
      </button>
    </div>
  )
}