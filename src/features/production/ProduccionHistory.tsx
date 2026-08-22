import { useAuth } from '../../shared/auth/AuthProvider'
import { Calendar, CheckCircle2, Clock } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../shared/lib/db'

export default function ProduccionHistory() {
  const { session } = useAuth()

  const historialCompleto = useLiveQuery(async () => {
    if (!session) return null;

    // 1. Obtener registros
    const registrosLocales = await db.registros_produccion
      .where('trabajador_id').equals(session.user.id)
      .reverse()
      .sortBy('created_at');

    if (registrosLocales.length === 0) return [];

    // 2. Descargar catálogos completos (2 consultas estáticas) en lugar de N+1
    const [operaciones, colores] = await Promise.all([
      db.operaciones.toArray(),
      db.colores.toArray()
    ]);

    // 3. Crear diccionarios de acceso O(1)
    const operacionesMap = new Map(operaciones.map(o => [o.id, o]));
    const coloresMap = new Map(colores.map(c => [c.id, c]));

    // 4. Mapeo síncrono rápido en memoria
    return registrosLocales.map((reg) => ({
      ...reg,
      operacion: operacionesMap.get(reg.operacion_id!),
      color: coloresMap.get(reg.color_id!)
    }));
  }, [session])

  if (!session) return null;
  
  if (historialCompleto === undefined) {
    return (
      <div className="flex flex-col justify-center items-center py-20 text-slate-500 animate-in fade-in">
        <Clock className="animate-spin mb-3 text-slate-400" size={32} />
        <span className="text-sm font-medium">Cargando tu historial...</span>
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
    <div className="max-w-3xl mx-auto p-4 md:p-6 mt-4 md:mt-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mi Historial</h2>
          <p className="text-slate-600 text-sm mt-1">Registros guardados en este dispositivo.</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-lg shadow-sm flex items-center gap-3">
          <span className="text-slate-600 text-sm font-medium">Total Generado</span>
          <span className="text-slate-900 font-bold text-xl">${totalGanado.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {historial.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-slate-50">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-lg font-medium text-slate-900 mb-1">Sin registros recientes</p>
            <p className="text-sm text-slate-600">Tu producción aparecerá aquí una vez que la registres.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historial.map((item) => {
              const precio = item.operacion?.precio_fijo ?? 0;
              const cantidad = item.cantidad ?? 0;
              const totalItem = cantidad * precio;
              const isPending = item.sync_status === 'pending';

              return (
                <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {item.operacion?.nombre ?? 'Operación eliminada'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 border border-slate-200">
                        {item.color?.codigo_hex && (
                          <div className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: item.color.codigo_hex }} aria-hidden="true" />
                        )}
                        <span>{item.color?.nombre ?? 'Sin color'}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {item.talla || 'Única'}
                      </span>
                      {item.lote && (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold uppercase">
                          OP: {item.lote}
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-900 border-l border-slate-300 pl-2 ml-1">
                        {cantidad} piezas
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 pt-4 sm:pt-0 border-slate-100">
                    <p className="font-bold text-slate-900 text-lg">${totalItem.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {isPending ? (
                        <span title="Pendiente de enviar al servidor" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" aria-hidden="true"></span>
                          Offline
                        </span>
                      ) : (
                        <span title="Guardado en el servidor" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          <CheckCircle2 size={12} aria-hidden="true" />
                          Nube
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-medium">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
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