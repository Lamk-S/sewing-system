import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/lib/supabase'

import PrendasList from './PrendasAdmin/PrendasList'
import ColoresList from './ColoresAdmin/ColoresList'
import OperacionesList from './OperacionesAdmin/OperacionesList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'

type Ranking = {
  id: string | null
  nombres: string | null
  apellidos: string | null
  fecha: string | null
  total_piezas: number | null
  total_ganado: number | null
}

type Eficiencia = {
  id: string | null
  nombres: string | null
  apellidos: string | null
  fecha: string | null
  total_horas: number | null
  total_ganado: number | null
  eficiencia: number | null
}

export default function AdminDashboard() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', fromDate, toDate],
    queryFn: async () => {
      let qRanking = supabase.from('v_ranking_trabajadores').select('*').limit(50)
      let qEficiencia = supabase.from('v_eficiencia_trabajadores').select('*').limit(50)

      if (fromDate) {
        qRanking = qRanking.gte('fecha', fromDate)
        qEficiencia = qEficiencia.gte('fecha', fromDate)
      }
      if (toDate) {
        qRanking = qRanking.lte('fecha', toDate)
        qEficiencia = qEficiencia.lte('fecha', toDate)
      }

      const [r1, r2] = await Promise.all([qRanking, qEficiencia])

      return {
        ranking: (r1.data as Ranking[]) || [],
        eficiencia: (r2.data as Eficiencia[]) || []
      }
    }
  })

  const rankingData = data?.ranking || []
  const eficienciaData = data?.eficiencia || []

  const totalTrabajadoresPeriodo = new Set(rankingData.map(r => r.id)).size
  const totalPiezasPeriodo = rankingData.reduce((acc, curr) => acc + (curr.total_piezas || 0), 0)
  const totalGanadoPeriodo = rankingData.reduce((acc, curr) => acc + (curr.total_ganado || 0), 0)

  const setHoy = () => {
    const today = new Date().toLocaleDateString('en-CA')
    setFromDate(today)
    setToDate(today)
  }

  const setSemana = () => {
    const now = new Date()
    const first = new Date(now.getTime())
    first.setDate(now.getDate() - now.getDay() + 1) // Lunes
    
    const last = new Date(first.getTime())
    last.setDate(first.getDate() + 6) // Domingo
    
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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona prendas, colores, operaciones y métricas
        </p>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-wrap gap-3 items-center">
        <input 
          type="date" 
          value={fromDate} 
          onChange={(e) => setFromDate(e.target.value)} 
          className="border p-2 rounded"
        />
        <input 
          type="date" 
          value={toDate} 
          onChange={(e) => setToDate(e.target.value)} 
          className="border p-2 rounded"
        />
        <button onClick={setHoy} className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-3 py-1 rounded">Hoy</button>
        <button onClick={setSemana} className="bg-purple-500 hover:bg-purple-600 transition-colors text-white px-3 py-1 rounded">Semana</button>
        <button onClick={setMes} className="bg-green-500 hover:bg-green-600 transition-colors text-white px-3 py-1 rounded">Mes</button>
      </div>

      {/* MÉTRICAS (Calculadas dinámicamente) */}
      {isLoading ? (
        <div className="animate-pulse flex space-x-4 mb-6">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white shadow rounded-xl border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Trabajadores en este periodo</p>
            <p className="text-2xl font-bold">{totalTrabajadoresPeriodo}</p>
          </div>
          <div className="p-4 bg-white shadow rounded-xl border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Piezas confeccionadas</p>
            <p className="text-2xl font-bold">{totalPiezasPeriodo}</p>
          </div>
          <div className="p-4 bg-white shadow rounded-xl border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Inversión / Pago total</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalGanadoPeriodo.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* RANKING Y EFICIENCIA (Con Scroll Integrado) */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* RANKING */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col max-h-96">
          <h2 className="font-bold mb-3 text-lg border-b pb-2 sticky top-0 bg-white">Ranking Producción</h2>
          <div className="overflow-y-auto flex-1 pr-2">
            {rankingData.length === 0 && !isLoading && (
              <p className="text-gray-500 text-sm py-4 text-center">No hay registros en estas fechas.</p>
            )}
            {rankingData.map((r, i) => (
              <div key={`${r.id}-${r.fecha}-${i}`} className="flex justify-between items-center border-b py-3 hover:bg-gray-50 px-2 rounded">
                <span className="font-medium text-gray-700">{r.nombres} {r.apellidos}</span>
                <div className="text-right">
                  <span className="block text-sm text-gray-500">{r.total_piezas ?? 0} piezas</span>
                  <span className="block font-bold text-green-600">${r.total_ganado?.toFixed(2) ?? '0.00'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EFICIENCIA */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col max-h-96">
          <h2 className="font-bold mb-3 text-lg border-b pb-2 sticky top-0 bg-white">Eficiencia / Hora</h2>
          <div className="overflow-y-auto flex-1 pr-2">
            {eficienciaData.length === 0 && !isLoading && (
              <p className="text-gray-500 text-sm py-4 text-center">No hay registros en estas fechas.</p>
            )}
            {eficienciaData.map((e, i) => (
              <div key={`${e.id}-${e.fecha}-${i}`} className="flex justify-between items-center border-b py-3 hover:bg-gray-50 px-2 rounded">
                <span className="font-medium text-gray-700">{e.nombres} {e.apellidos}</span>
                <div className="text-right">
                  <span className="block text-sm text-gray-500">{e.total_horas ?? 0}h trabajadas</span>
                  <span className="block text-blue-600 font-bold">${e.eficiencia?.toFixed(2) ?? '0.00'}/h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS DE MANTENIMIENTO */}
      <Tabs defaultValue="prendas" className="w-full mt-2 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold mb-4 text-xl">Gestión de Catálogos</h2>
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="prendas" className="rounded-md">Prendas</TabsTrigger>
          <TabsTrigger value="operaciones" className="rounded-md">Operaciones</TabsTrigger>
          <TabsTrigger value="colores" className="rounded-md">Colores</TabsTrigger>
        </TabsList>
        <TabsContent value="prendas" className="mt-6"><PrendasList /></TabsContent>
        <TabsContent value="operaciones" className="mt-6"><OperacionesList /></TabsContent>
        <TabsContent value="colores" className="mt-6"><ColoresList /></TabsContent>
      </Tabs>
    </div>
  )
}