import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/lib/supabase'
import { History, Calendar } from 'lucide-react'

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
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 rounded-full" />
      </div>
    )
  }

  if (!historial || historial.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">
        <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No hay registros de producción en la base de datos.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
        <History className="text-blue-600" size={20} />
        <h3 className="font-bold text-gray-700">Últimos 100 Registros de Producción (Global)</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-medium">Trabajador</th>
              <th className="p-4 font-medium">Operación</th>
              <th className="p-4 font-medium">Color</th>
              <th className="p-4 font-medium text-center">Cantidad</th>
              <th className="p-4 font-medium text-right">Pago</th>
              <th className="p-4 font-medium text-right">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {historial.map((reg) => {
              const pagoTotal = (reg.cantidad || 0) * (reg.operaciones?.precio_fijo || 0)
              
              return (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">
                    {reg.perfiles?.nombres} {reg.perfiles?.apellidos}
                  </td>
                  <td className="p-4 text-gray-600">
                    {reg.operaciones?.nombre}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {reg.colores?.codigo_hex && (
                        <div 
                          className="w-3 h-3 rounded-full border shadow-sm" 
                          style={{ backgroundColor: reg.colores.codigo_hex }} 
                        />
                      )}
                      <span className="text-gray-600">{reg.colores?.nombre || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-gray-700">
                    {reg.cantidad}
                  </td>
                  <td className="p-4 text-right font-bold text-green-600">
                    ${pagoTotal.toFixed(2)}
                  </td>
                  <td className="p-4 text-right text-gray-500 text-xs">
                    {new Date(reg.created_at).toLocaleString()}
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