import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/lib/supabase'

import PrendasList from './PrendasAdmin/PrendasList'
import ColoresList from './ColoresAdmin/ColoresList'
import OperacionesList from './OperacionesAdmin/OperacionesList'
import HistorialGlobal from './HistorialGlobal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { Users, LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react'

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

type TrabajadorMetrics = {
  id: string
  nombres: string
  apellidos: string
  total_piezas: number
  total_ganado: number
  total_horas: number
  eficiencia: number
  fecha?: string
}

export default function AdminDashboard() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data, isLoading } = useQuery({
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

      const ranking: TrabajadorMetrics[] = (Object.values(mapRanking) as TrabajadorMetrics[])
        .sort((a, b) => b.total_ganado - a.total_ganado)
        
      const eficiencia: TrabajadorMetrics[] = (Object.values(mapEficiencia) as TrabajadorMetrics[])
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

  // Métricas Globales
  const totalTrabajadoresPeriodo = rankingData.length
  const totalPiezasPeriodo = rankingData.reduce((acc, curr) => acc + curr.total_piezas, 0)
  const totalGanadoPeriodo = rankingData.reduce((acc, curr) => acc + curr.total_ganado, 0)

  const setHoy = () => {
    const today = new Date().toLocaleDateString('en-CA')
    setFromDate(today)
    setToDate(today)
  }

  const setSemana = () => {
    const now = new Date()
    const first = new Date(now.getTime())
    first.setDate(now.getDate() - now.getDay() + 1)
    const last = new Date(first.getTime())
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
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="text-primary" />
          Panel de Administración
        </h1>
        <p className="text-slate-500 mt-1">
          Supervisión de producción, eficiencia y gestión de catálogos.
        </p>
      </div>

      {/* FILTROS INTELIGENTES */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <CalendarIcon className="text-slate-400" size={20} />
          <input 
            type="date" 
            value={fromDate} 
            onChange={(e) => setFromDate(e.target.value)} 
            className="border border-slate-300 text-sm p-2 rounded-lg text-slate-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <span className="text-slate-400">hasta</span>
          <input 
            type="date" 
            value={toDate} 
            onChange={(e) => setToDate(e.target.value)} 
            className="border border-slate-300 text-sm p-2 rounded-lg text-slate-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <button onClick={setHoy} className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Hoy</button>
          <button onClick={setSemana} className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Semana</button>
          <button onClick={setMes} className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Mes</button>
        </div>
      </div>

      {/* MÉTRICAS */}
      {isLoading ? (
        <div className="animate-pulse grid md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 bg-white shadow-sm rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-1">Trabajadores Activos</p>
            <p className="text-3xl font-bold text-slate-900">{totalTrabajadoresPeriodo}</p>
          </div>
          <div className="p-5 bg-white shadow-sm rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-1">Piezas Confeccionadas</p>
            <p className="text-3xl font-bold text-slate-900">{totalPiezasPeriodo}</p>
          </div>
          <div className="p-5 bg-white shadow-sm rounded-xl border border-slate-200 border-l-4 border-l-emerald-500">
            <p className="text-sm font-medium text-slate-500 mb-1">Inversión / Pago Total</p>
            <p className="text-3xl font-bold text-emerald-600">
              ${totalGanadoPeriodo.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* RANKING Y EFICIENCIA */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-96 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="font-semibold text-slate-800">Ranking de Producción</h2>
          </div>
          <div className="overflow-y-auto p-2">
            {rankingData.length === 0 && !isLoading && (
              <p className="text-slate-500 text-sm py-8 text-center">No hay registros en este periodo.</p>
            )}
            {rankingData.map((r, i) => (
              <div key={`${r.id}-${r.fecha}-${i}`} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                <span className="font-medium text-slate-700">{r.nombres} {r.apellidos}</span>
                <div className="text-right">
                  <span className="block text-sm text-slate-500">{r.total_piezas ?? 0} piezas</span>
                  <span className="block font-bold text-emerald-600">${r.total_ganado?.toFixed(2) ?? '0.00'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-96 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary" />
            <h2 className="font-semibold text-slate-800">Eficiencia por Hora</h2>
          </div>
          <div className="overflow-y-auto p-2">
            {eficienciaData.length === 0 && !isLoading && (
              <p className="text-slate-500 text-sm py-8 text-center">No hay registros en este periodo.</p>
            )}
            {eficienciaData.map((e, i) => (
              <div key={`${e.id}-${e.fecha}-${i}`} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                <span className="font-medium text-slate-700">{e.nombres} {e.apellidos}</span>
                <div className="text-right">
                  <span className="block text-sm text-slate-500">{e.total_horas ?? 0}h trabajadas</span>
                  <span className="block font-bold text-primary">${e.eficiencia?.toFixed(2) ?? '0.00'}/h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS DE MANTENIMIENTO */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
        <Tabs defaultValue="historial" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="font-bold text-xl text-slate-800">Gestión Operativa</h2>
            <TabsList className="bg-slate-100 p-1 rounded-lg flex overflow-x-auto">
              <TabsTrigger value="historial" className="rounded-md px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Historial</TabsTrigger>
              <TabsTrigger value="prendas" className="rounded-md px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Prendas</TabsTrigger>
              <TabsTrigger value="operaciones" className="rounded-md px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Operaciones</TabsTrigger>
              <TabsTrigger value="colores" className="rounded-md px-4 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Colores</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="historial" className="outline-none"><HistorialGlobal /></TabsContent>
          <TabsContent value="prendas" className="outline-none"><PrendasList /></TabsContent>
          <TabsContent value="operaciones" className="outline-none"><OperacionesList /></TabsContent>
          <TabsContent value="colores" className="outline-none"><ColoresList /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}