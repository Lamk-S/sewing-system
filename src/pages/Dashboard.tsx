import { useAuth } from '../shared/auth/AuthProvider'
import { BarChart, DollarSign, Clock } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../shared/lib/db'

const obtenerSemana = (fechaString: string) => {
  const date = new Date(fechaString)
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()} - Sem ${weekNo.toString().padStart(2, '0')}`
}

export default function Dashboard() {
  const { session } = useAuth()

  const metricasLocales = useLiveQuery(async () => {
    if (!session) return null

    // 1. Traer todos los datos del trabajador guardados en su dispositivo
    const workerId = session.user.id
    const [registros, turnos, operaciones] = await Promise.all([
      db.registros_produccion.where('trabajador_id').equals(workerId).toArray(),
      db.turnos.where('trabajador_id').equals(workerId).toArray(),
      db.operaciones.toArray()
    ])

    // 2. Crear un mapa rápido de precios de operaciones
    const preciosOperaciones = new Map<number, number>()
    operaciones.forEach(op => preciosOperaciones.set(op.id!, op.precio_fijo || 0))

    // ==========================================
    // CÁLCULO 1: RESUMEN DIARIO
    // ==========================================
    const mapaDiario: Record<string, { fecha_trabajo: string; total_piezas: number; total_ganado: number }> = {}
    registros.forEach(reg => {
      const fecha = reg.fecha_trabajo!
      const precio = preciosOperaciones.get(reg.operacion_id!) || 0
      const ganado = (reg.cantidad || 0) * precio

      if (!mapaDiario[fecha]) {
        mapaDiario[fecha] = { fecha_trabajo: fecha, total_piezas: 0, total_ganado: 0 }
      }
      mapaDiario[fecha].total_piezas += (reg.cantidad || 0)
      mapaDiario[fecha].total_ganado += ganado
    })

    const diario = Object.values(mapaDiario)
      .sort((a, b) => b.fecha_trabajo.localeCompare(a.fecha_trabajo))
      .slice(0, 7) // Últimos 7 días

    // ==========================================
    // CÁLCULO 2: RESUMEN SEMANAL
    // ==========================================
    const mapaSemanal: Record<string, { semana: string; total_piezas: number; total_ganado: number }> = {}
    registros.forEach(reg => {
      const semana = obtenerSemana(reg.fecha_trabajo!)
      const precio = preciosOperaciones.get(reg.operacion_id!) || 0
      const ganado = (reg.cantidad || 0) * precio

      if (!mapaSemanal[semana]) {
        mapaSemanal[semana] = { semana, total_piezas: 0, total_ganado: 0 }
      }
      mapaSemanal[semana].total_piezas += (reg.cantidad || 0)
      mapaSemanal[semana].total_ganado += ganado
    })

    const semanal = Object.values(mapaSemanal)
      .sort((a, b) => b.semana.localeCompare(a.semana))
      .slice(0, 4) // Últimas 4 semanas

    // ==========================================
    // CÁLCULO 3: TARIFA HORARIA REAL
    // ==========================================
    const mapaHoras: Record<string, number> = {}
    turnos.forEach(turno => {
      if (turno.total_horas && turno.total_horas > 0) {
        if (!mapaHoras[turno.fecha!]) mapaHoras[turno.fecha!] = 0
        mapaHoras[turno.fecha!] += turno.total_horas
      }
    })

    const tarifa: { fecha: string; total_horas: number; tarifa_horaria_real: number }[] = []
    Object.keys(mapaHoras).forEach(fecha => {
      const ganadoEseDia = mapaDiario[fecha]?.total_ganado || 0
      const horasEseDia = mapaHoras[fecha]
      tarifa.push({
        fecha,
        total_horas: horasEseDia,
        tarifa_horaria_real: horasEseDia > 0 ? (ganadoEseDia / horasEseDia) : 0
      })
    })

    tarifa.sort((a, b) => b.fecha.localeCompare(a.fecha))
    const tarifaLimitada = tarifa.slice(0, 7)

    return { diario, semanal, tarifa: tarifaLimitada }
  }, [session])

  if (metricasLocales === undefined) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 animate-in fade-in">
        <Clock className="animate-spin mr-2" size={24} />
        <span>Calculando tu rendimiento...</span>
      </div>
    )
  }

  const { diario = [], semanal = [], tarifa = [] } = metricasLocales || {}

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 mt-2 animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Mi Rendimiento</h2>
        <p className="text-sm text-slate-500">Métricas de producción y ganancias calculadas localmente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Resumen Diario */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-md">
               <BarChart className="text-primary" size={18} aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900">Resumen Diario</h3>
          </div>
          <div className="overflow-y-auto p-3 flex-1 scrollbar-thin">
            {diario.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No hay registros recientes</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {diario.map((item) => (
                  <div key={item.fecha_trabajo} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <span className="font-medium text-slate-700">{item.fecha_trabajo}</span>
                    <div className="text-right">
                      <span className="block text-sm text-slate-500">{item.total_piezas} pzs</span>
                      <span className="block font-bold text-emerald-600">${item.total_ganado.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tarifa Horaria */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Clock className="text-primary" size={18} aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900">Tarifa Horaria Real</h3>
          </div>
          <div className="overflow-y-auto p-3 flex-1 scrollbar-thin">
            {tarifa.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No hay turnos cerrados</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tarifa.map((item) => (
                  <div key={item.fecha} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <span className="font-medium text-slate-700">{item.fecha}</span>
                    <div className="text-right">
                      <span className="block text-sm text-slate-500">{item.total_horas.toFixed(1)} hrs</span>
                      <span className="block font-bold text-amber-600">${item.tarifa_horaria_real.toFixed(2)}/h</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen Semanal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
             <div className="p-1.5 bg-primary/10 rounded-md">
               <DollarSign className="text-primary" size={18} aria-hidden="true" />
             </div>
            <h3 className="font-bold text-slate-900">Resumen Semanal</h3>
          </div>
          <div className="overflow-y-auto p-3 flex-1 scrollbar-thin">
            {semanal.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No hay datos semanales</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {semanal.map((item) => (
                  <div key={item.semana} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <span className="font-medium text-slate-700">{item.semana}</span>
                    <div className="text-right">
                      <span className="block text-sm text-slate-500">{item.total_piezas} pzs</span>
                      <span className="block font-bold text-emerald-600">${item.total_ganado.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}