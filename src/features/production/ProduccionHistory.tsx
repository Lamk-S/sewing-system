import { useAuth } from '../../shared/auth/AuthProvider'
import { Calendar, CheckCircle2, Clock } from 'lucide-react'
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
      
      return { ...reg, operacion, color };
    }));
  }, [session])

  if (!session) return null;
  
  if (historialCompleto === undefined) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <Clock className="animate-spin mr-2" size={24} />
        <span>Cargando tu historial...</span>
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
    <div className="max-w-3xl mx-auto p-4 md:p-6 mt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mi Historial</h2>
          <p className="text-slate-500 text-sm">Registros guardados en este dispositivo</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-3">
          <span className="text-emerald-800 text-sm font-medium">Total Generado</span>
          <span className="text-emerald-600 font-bold text-xl">${totalGanado.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {historial.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
            <p className="text-lg font-medium text-slate-700 mb-1">Sin registros recientes</p>
            <p className="text-sm">Tu producción aparecerá aquí una vez que la registres.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historial.map((item) => {
              const precio = item.operacion?.precio_fijo ?? 0;
              const cantidad = item.cantidad ?? 0;
              const totalItem = cantidad * precio;
              const isPending = item.sync_status === 'pending';

              return (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {item.operacion?.nombre ?? 'Operación eliminada'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-600">
                        {item.color?.codigo_hex && (
                          <div className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: item.color.codigo_hex }} />
                        )}
                        <span>{item.color?.nombre ?? 'Sin color'}</span>
                      </div>
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded text-xs font-bold">
                        {item.talla || 'Única'}
                      </span>
                      {item.lote && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded text-xs font-bold uppercase">
                          OP: {item.lote}
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-700 border-l border-slate-300 pl-2">
                        {cantidad} piezas
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                    <p className="font-bold text-emerald-600 text-lg">${totalItem.toFixed(2)}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isPending ? (
                        <span title="Pendiente de enviar al servidor" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          Offline
                        </span>
                      ) : (
                        <span title="Guardado en el servidor" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={10} />
                          Nube
                        </span>
                      )}
                      <p className="text-xs text-slate-400 font-medium">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </p>
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