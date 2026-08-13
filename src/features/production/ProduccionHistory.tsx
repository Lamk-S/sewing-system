import { useAuth } from '../../shared/auth/useAuth'
import { Calendar } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../shared/lib/db'

export default function ProduccionHistory() {
  const { session } = useAuth()

  const historialCompleto = useLiveQuery(async () => {
    if (!session) return null;

    const registrosLocales = await db.registros_produccion
      .where('trabajador_id').equals(session.user.id)
      .reverse()
      .sortBy('created_at');

    return Promise.all(registrosLocales.map(async (reg) => {
      const operacion = await db.operaciones.get(reg.operacion_id!);
      const color = await db.colores.get(reg.color_id!);
      
      return {
        ...reg,
        operacion,
        color
      };
    }));
  }, [session])

  if (!session) return null;
  if (historialCompleto === undefined) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin h-6 w-6 border-b-2 border-gray-900 rounded-full" />
      </div>
    )
  }

  const historial = historialCompleto || [];
  
  const totalGanado = historial.reduce((sum, item) => {
    const precio = item.operacion?.precio_fijo ?? 0;
    const cantidad = item.cantidad ?? 0;
    return sum + (cantidad * precio);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Historial de Producción (Local)</h2>
        <div className="bg-green-100 px-4 py-2 rounded-lg">
          <span className="text-green-800 font-bold">${totalGanado.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {historial.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay registros de producción recientes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {historial.map((item) => {
              const precio = item.operacion?.precio_fijo ?? 0;
              const cantidad = item.cantidad ?? 0;
              const totalItem = cantidad * precio;

              return (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {item.operacion?.nombre ?? 'Operación desconocida'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                         {item.color?.codigo_hex && (
                            <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.color.codigo_hex }} />
                         )}
                        <p className="text-sm text-gray-500">
                          {item.color?.nombre ?? 'Sin color'} • {cantidad} piezas
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-bold text-green-600">${totalItem.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Pequeño indicador si está pendiente de sincronizar */}
                        {item.sync_status === 'pending' && (
                           <span title="Pendiente de enviar al servidor" className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        )}
                        <p className="text-xs text-gray-400">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}