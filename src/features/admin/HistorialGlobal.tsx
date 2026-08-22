import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/lib/supabase'
import { History, FileX, Loader2 } from 'lucide-react'

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
  })

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 text-slate-500">
        <Loader2 className="animate-spin mb-3 text-slate-400" size={32} />
        <span className="text-sm font-medium">Cargando historial del servidor...</span>
      </div>
    )
  }

  if (!historial || historial.length === 0) {
    return (
      <div className="p-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        <FileX size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-lg font-bold text-slate-900 mb-1">Historial vacío</p>
        <p className="text-sm text-slate-600">No hay registros de producción en la base de datos.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <History className="text-primary" size={18} aria-hidden="true" />
        </div>
        <h3 className="font-bold text-slate-900">Últimos 100 Registros de Producción</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Trabajador</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Operación</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Color</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Cant.</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Pago</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historial.map((reg) => {
              const pagoTotal = (reg.cantidad || 0) * (reg.operaciones?.precio_fijo || 0)
              
              return (
                <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {reg.perfiles?.nombres} {reg.perfiles?.apellidos}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {reg.operaciones?.nombre}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {reg.colores?.codigo_hex && (
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm" 
                          style={{ backgroundColor: reg.colores.codigo_hex }} 
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-slate-700 font-medium">{reg.colores?.nombre || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-900">
                    {reg.cantidad}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    ${pagoTotal.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-500 text-xs font-medium">
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