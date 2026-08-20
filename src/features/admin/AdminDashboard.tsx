import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/lib/supabase'

import PrendasList from './PrendasAdmin/PrendasList'
import ColoresList from './ColoresAdmin/ColoresList'
import OperacionesList from './OperacionesAdmin/OperacionesList'
import HistorialGlobal from './HistorialGlobal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { Users, LayoutDashboard, Calendar as CalendarIcon, FileSpreadsheet, FileText, AlertCircle, History, Shirt, Scissors, Palette } from 'lucide-react'
import { exportToExcel, exportToPDF } from '../../shared/lib/exportUtils'

type RawRanking = {
  id: string
  nombres: string
  apellidos: string
  fecha: string
  total_piezas: number
  total_ganado: number
}

type RawEficiencia = {
  id: string
  nombres: string
  apellidos: string
  fecha: string
  total_horas: number
  total_ganado: number
  eficiencia: number
}

interface TrabajadorMetrics {
  id: string
  nombres: string
  apellidos: string
  total_piezas: number
  total_ganado: number
  total_horas: number
  eficiencia: number
  fecha?: string
  [key: string]: unknown 
}

// 1. Componente extraído para limpiar el JSX principal
const MetricCard = ({ title, value, borderClass = 'border-slate-200' }: { title: string; value: string | number; borderClass?: string }) => (
  <div className={`p-5 bg-white shadow-sm rounded-xl border ${borderClass} flex flex-col justify-center`}>
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
  </div>
)

export default function AdminDashboard() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-metrics', fromDate, toDate],
    queryFn: async () => {
      let qRanking = supabase.from('v_ranking_trabajadores').select('*')
      let qEficiencia = supabase.from('v_eficiencia_trabajadores').select('*')

      if (fromDate) {
        qRanking = qRanking.gte('fecha', fromDate)
        qEficiencia = qEficiencia.gte('fecha', fromDate)
      }
      if (toDate) {
        qRanking = qRanking.lte('fecha', toDate)
        qEficiencia = qEficiencia.lte('fecha', toDate)
      }

      const [r1, r2] = await Promise.all([qRanking, qEficiencia])
      
      if (r1.error) throw r1.error
      if (r2.error) throw r2.error

      const rawRanking = (r1.data as unknown as RawRanking[]) || []
      const rawEficiencia = (r2.data as unknown as RawEficiencia[]) || []

      const mapRanking = rawRanking.reduce((acc, curr) => {
        if (!acc[curr.id]) acc[curr.id] = { ...curr, total_piezas: 0, total_ganado: 0, total_horas: 0, eficiencia: 0 }
        acc[curr.id].total_piezas += (curr.total_piezas || 0)
        acc[curr.id].total_ganado += (curr.total_ganado || 0)
        return acc
      }, {} as Record<string, TrabajadorMetrics>)

      const mapEficiencia = rawEficiencia.reduce((acc, curr) => {
        if (!acc[curr.id]) acc[curr.id] = { ...curr, total_piezas: 0, total_horas: 0, total_ganado: 0, eficiencia: 0 }
        acc[curr.id].total_horas += (curr.total_horas || 0)
        acc[curr.id].total_ganado += (curr.total_ganado || 0)
        return acc
      }, {} as Record<string, TrabajadorMetrics>)

      const ranking: TrabajadorMetrics[] = Object.values(mapRanking)
        .sort((a, b) => b.total_ganado - a.total_ganado)
        
      const eficiencia: TrabajadorMetrics[] = Object.values(mapEficiencia)
        .map((e) => ({
          ...e,
          eficiencia: e.total_horas > 0 ? (e.total_ganado / e.total_horas) : 0
        }))
        .sort((a, b) => b.eficiencia - a.eficiencia)

      return { ranking, eficiencia }
    }
  })

  const rankingData = data?.ranking || []
  const eficienciaData = data?.eficiencia || []

  // Métricas Globales calculadas eficientemente
  const totalTrabajadoresPeriodo = rankingData.length
  const totalPiezasPeriodo = rankingData.reduce((acc, curr) => acc + curr.total_piezas, 0)
  const totalGanadoPeriodo = rankingData.reduce((acc, curr) => acc + curr.total_ganado, 0)

  // Manejadores de fechas robustos
  const setHoy = () => {
    const today = new Date().toLocaleDateString('en-CA')
    setFromDate(today)
    setToDate(today)
  }

  const setSemana = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() 
    const first = new Date(now)
    first.setDate(now.getDate() - dayOfWeek + 1)
    const last = new Date(first)
    last.setDate(first.getDate() + 6)
    setFromDate(first.toLocaleDateString('en-CA'))
    setToDate(last.toLocaleDateString('en-CA'))
  }

  const setMes = () => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFromDate(first.toLocaleDateString('en-CA'))
    setToDate(last.toLocaleDateString('en-CA'))
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <LayoutDashboard className="text-primary" size={24} aria-hidden="true" />
          </div>
          Panel de Administración
        </h1>
        <p className="text-sm md:text-base text-slate-600 mt-2">
          Supervisión de producción, eficiencia y gestión de catálogos.
        </p>
      </div>

      {/* CONTROLES: FILTROS Y EXPORTACIÓN */}
      <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 mb-8 flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center">
        
        <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-4 w-full lg:w-auto">
          {/* Inputs de Fecha */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <CalendarIcon className="text-slate-500 hidden sm:block shrink-0" size={20} aria-hidden="true" />
            
            {/* Contenedor Grid para móviles, Flex para desktop */}
            <div className="grid grid-cols-[1fr_auto_1fr] sm:flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="date" 
                aria-label="Fecha de inicio"
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
                className="w-full sm:w-32 md:w-36 min-w-0 border border-slate-300 text-sm p-2 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm"
              />
              <span className="text-slate-400 text-sm font-medium shrink-0">a</span>
              <input 
                type="date" 
                aria-label="Fecha de fin"
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
                className="w-full sm:w-32 md:w-36 min-w-0 border border-slate-300 text-sm p-2 rounded-md text-slate-900 bg-white focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm"
              />
            </div>
          </div>
          
          {/* Botones de Rango Rápido */}
          <div className="grid grid-cols-3 sm:flex gap-2 w-full md:w-auto md:border-l md:border-slate-300 md:pl-4">
            <button onClick={setHoy} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-100 transition-colors shadow-sm">Hoy</button>
            <button onClick={setSemana} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-100 transition-colors shadow-sm">Semana</button>
            <button onClick={setMes} className="w-full sm:w-auto px-4 py-2 text-sm font-semibold border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-100 transition-colors shadow-sm">Mes</button>
          </div>
        </div>
        
        {/* Exportación */}
        <div className="flex gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t border-slate-200 lg:border-0">
          <button
            onClick={() => exportToExcel(rankingData, `Ranking_${new Date().toISOString().split('T')[0]}`)}
            disabled={rankingData.length === 0 || isLoading}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-md font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            <FileSpreadsheet size={18} className="text-slate-500" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => exportToPDF(
              rankingData, 
              [
                { header: 'Nombres', dataKey: 'nombres' },
                { header: 'Apellidos', dataKey: 'apellidos' },
                { header: 'Piezas', dataKey: 'total_piezas' },
                { header: 'Total Ganado', dataKey: 'total_ganado' }
              ],
              `Ranking_${new Date().toISOString().split('T')[0]}`,
              `Reporte de Producción (Destajo)`
            )}
            disabled={rankingData.length === 0 || isLoading}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-md font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            <FileText size={18} className="text-slate-500" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* ESTADO DE ERROR */}
      {isError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 shadow-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={20} aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-sm">Error de conexión</h3>
            <p className="text-sm opacity-90 mt-1">No pudimos cargar los datos. Verifica tu conexión o intenta recargar la página.</p>
          </div>
        </div>
      )}

      {/* MÉTRICAS */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="h-26 bg-slate-200 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <MetricCard title="Trabajadores Activos" value={totalTrabajadoresPeriodo} />
          <MetricCard title="Piezas Confeccionadas" value={totalPiezasPeriodo} />
          <MetricCard title="Inversión / Pago Total" value={`$${totalGanadoPeriodo.toFixed(2)}`} />
        </div>
      )}

      {/* RANKING Y EFICIENCIA (RSPONSIVE HEIGHTS) */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-80 md:h-96 xl:h-112.5">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 rounded-t-xl shrink-0">
            <Users size={18} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-slate-800">Ranking de Producción</h2>
          </div>
          <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
            {rankingData.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-37.5 text-slate-400">
                <LayoutDashboard size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Sin datos en este periodo</p>
              </div>
            ) : (
              rankingData.map((r) => (
                <div key={r.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0 group">
                  <span className="font-medium text-slate-700 group-hover:text-primary transition-colors">{r.nombres} {r.apellidos}</span>
                  <div className="text-right">
                    <span className="block text-sm text-slate-500">{r.total_piezas} piezas</span>
                    <span className="block font-bold text-emerald-600">${r.total_ganado.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-80 md:h-96 xl:h-112.5">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 rounded-t-xl shrink-0">
            <CalendarIcon size={18} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-slate-800">Eficiencia por Hora</h2>
          </div>
          <div className="overflow-y-auto p-2 flex-1 scrollbar-thin">
            {eficienciaData.length === 0 && !isLoading ? (
               <div className="flex flex-col items-center justify-center h-full min-h-37.5 text-slate-400">
                 <LayoutDashboard size={32} className="mb-2 opacity-50" />
                 <p className="text-sm font-medium">Sin datos en este periodo</p>
               </div>
            ) : (
              eficienciaData.map((e) => (
                <div key={e.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0 group">
                  <span className="font-medium text-slate-700 group-hover:text-primary transition-colors">{e.nombres} {e.apellidos}</span>
                  <div className="text-right">
                    <span className="block text-sm text-slate-500">{e.total_horas.toFixed(1)}h trabajadas</span>
                    <span className="block font-bold text-primary">${e.eficiencia.toFixed(2)}/h</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* TABS DE MANTENIMIENTO */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-8">
        <div className="mb-5">
          <h2 className="font-bold text-xl text-slate-800">Gestión Operativa</h2>
          <p className="text-sm text-slate-500 mt-1">
            Administra el historial de registros y los catálogos base del sistema.
          </p>
        </div>

        <Tabs defaultValue="historial" className="w-full">
          <div className="w-full mb-6">
            <TabsList className="flex w-full overflow-x-auto scrollbar-hide bg-slate-100 p-1.5 rounded-xl gap-1 items-center justify-start">
              
              <TabsTrigger 
                value="historial" 
                className="flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg outline-none text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <History size={16} />
                <span>Historial</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="prendas" 
                className="flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg outline-none text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <Shirt size={16} />
                <span>Prendas</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="operaciones" 
                className="flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg outline-none text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <Scissors size={16} />
                <span>Operaciones</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="colores" 
                className="flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-lg outline-none text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 data-[state=active]:text-primary data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <Palette size={16} />
                <span>Colores</span>
              </TabsTrigger>

            </TabsList>
          </div>
          
          <div className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg">
            <TabsContent value="historial" className="mt-0 outline-none"><HistorialGlobal /></TabsContent>
            <TabsContent value="prendas" className="mt-0 outline-none"><PrendasList /></TabsContent>
            <TabsContent value="operaciones" className="mt-0 outline-none"><OperacionesList /></TabsContent>
            <TabsContent value="colores" className="mt-0 outline-none"><ColoresList /></TabsContent>
          </div>
        </Tabs>
      </div>

    </div>
  )
}