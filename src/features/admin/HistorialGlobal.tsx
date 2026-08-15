import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/lib/supabase'
import { History, FileX } from 'lucide-react'

type RegistroGlobal = {
  id: number
  cantidad: number
  fecha_trabajo: string
  created_at: string
  perfiles: { nombres: string; apellidos: string } | null
  operaciones: { nombre: string; precio_fijo: number } | null
  colores: { nombre: string; codigo_hex: string } | null
}

export default function HistorialGlobal() {
  const { data: historial, isLoading } = useQuery({
    queryKey: ['historial-global-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registros_produccion')
        .select(`
          id,
          cantidad,
          fecha_trabajo,
          created_at,
          perfiles(nombres, apellidos),
          operaciones(nombre, precio_fijo),
          colores(nombre, codigo_hex)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as RegistroGlobal[]
    },
    refetchInterval: 30000
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    )
  }

  if (!historial || historial.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <FileX size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
        <p className="text-lg font-medium text-slate-600">Historial vacío</p>
        <p className="text-sm">No hay registros de producción en la base de datos.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <History className="text-primary" size={18} />
        <h3 className="font-semibold text-slate-800">Últimos 100 Registros de Producción</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trabajador</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operación</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Cant.</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Pago</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historial.map((reg) => {
              const pagoTotal = (reg.cantidad || 0) * (reg.operaciones?.precio_fijo || 0)
              
              return (
                <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {reg.perfiles?.nombres} {reg.perfiles?.apellidos}
                  </td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {reg.operaciones?.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {reg.colores?.codigo_hex && (
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-sm" 
                          style={{ backgroundColor: reg.colores.codigo_hex }} 
                        />
                      )}
                      <span className="text-slate-600">{reg.colores?.nombre || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">
                    {reg.cantidad}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    ${pagoTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 text-xs whitespace-nowrap">
                    {new Date(reg.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}