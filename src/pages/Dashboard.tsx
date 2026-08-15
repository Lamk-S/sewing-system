import { useQuery } from '@tanstack/react-query'
import { supabase } from '../shared/lib/supabase'
import { useAuth } from '../shared/auth/AuthProvider'
import { BarChart, DollarSign, Clock } from 'lucide-react'

type ResumenDiario = { fecha_trabajo: string; total_piezas: number; total_ganado: number }
type ResumenSemanal = { semana: string; total_piezas: number; total_ganado: number }
type TarifaHoraria = { fecha: string; total_horas: number; tarifa_horaria_real: number }

export default function Dashboard() {
  const { session } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-trabajador', session?.user.id],
    queryFn: async () => {
      const [resDiario, resSemanal, resTarifa] = await Promise.all([
        supabase.from('v_resumen_diario').select('*').limit(7), // Últimos 7 días
        supabase.from('v_resumen_semanal').select('*').limit(4), // Últimas 4 semanas
        supabase.from('v_tarifa_horaria').select('*').limit(7) // Últimos 7 turnos
      ])

      return {
        diario: (resDiario.data as unknown as ResumenDiario[]) || [],
        semanal: (resSemanal.data as unknown as ResumenSemanal[]) || [],
        tarifa: (resTarifa.data as unknown as TarifaHoraria[]) || []
      }
    },
    enabled: !!session
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <Clock className="animate-spin mr-2" size={24} />
        <span>Cargando tu rendimiento...</span>
      </div>
    )
  }

  const { diario = [], semanal = [], tarifa = [] } = data || {}

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 mt-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Mi Rendimiento</h2>
        <p className="text-sm text-slate-500">Métricas de producción y ganancias calculadas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Resumen Diario */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <BarChart className="text-primary" size={20} />
            <h3 className="font-semibold text-slate-800">Resumen Diario</h3>
          </div>
          <div className="overflow-y-auto p-3 flex-1">
            {diario.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No hay registros recientes</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {diario.map((item) => (
                  <div key={item.fecha_trabajo} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">{item.fecha_trabajo}</span>
                    <div className="text-right">
                      <span className="block text-sm text-slate-500">{item.total_piezas ?? 0} pzs</span>
                      <span className="block font-bold text-emerald-600">${(item.total_ganado ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tarifa Horaria */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Clock className="text-amber-500" size={20} />
            <h3 className="font-semibold text-slate-800">Tarifa Horaria Real</h3>
          </div>
          <div className="overflow-y-auto p-3 flex-1">
            {tarifa.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No hay turnos cerrados</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tarifa.map((item) => (
                  <div key={item.fecha} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">{item.fecha}</span>
                    <div className="text-right">
                      <span className="block text-sm text-slate-500">{item.total_horas ?? 0} hrs</span>
                      <span className="block font-bold text-amber-600">${(item.tarifa_horaria_real ?? 0).toFixed(2)}/h</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen Semanal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <DollarSign className="text-emerald-600" size={20} />
            <h3 className="font-semibold text-slate-800">Resumen Semanal</h3>
          </div>
          <div className="overflow-y-auto p-3 flex-1">
            {semanal.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No hay datos semanales</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {semanal.map((item) => (
                  <div key={item.semana} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Semana {item.semana}</span>
                    <div className="text-right">
                      <span className="block text-sm text-slate-500">{item.total_piezas ?? 0} pzs</span>
                      <span className="block font-bold text-emerald-600">${(item.total_ganado ?? 0).toFixed(2)}</span>
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