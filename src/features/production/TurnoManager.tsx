import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../shared/auth/AuthProvider'
import { db } from '../../shared/lib/db'
import { supabase } from '../../shared/lib/supabase'
import { toast } from 'sonner'
import { Clock, PlayCircle, StopCircle, Users, Activity } from 'lucide-react'
import { useSyncCatalogs } from '../../shared/hooks/useSyncCatalogs'
import { calcularDuracionTurno } from './utils/time'

type TurnoConPerfil = {
  id: number;
  hora_inicio: string;
  perfiles: {
    nombres: string;
    apellidos: string;
  } | null;
}

// Garantiza formato YYYY-MM-DD en la zona horaria de Perú
const getLocalDateString = (date: Date) => {
  return date.toLocaleDateString('en-CA', { 
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'
  });
}

export default function TurnoManager() {
  const { session, isAdmin } = useAuth()
  const [guardando, setGuardando] = useState(false)
  const { triggerSync } = useSyncCatalogs()

  const turnoActivo = useLiveQuery(
    async () => {
      if (!session || isAdmin) return null;
      const turno = await db.turnos
        .where('trabajador_id').equals(session.user.id)
        .filter(t => t.estado === 'abierto')
        .first();
      return turno !== undefined ? turno : null;
    },
    [session, isAdmin]
  )

  const { data: turnosGlobales, isLoading: loadingAdmin } = useQuery({
    queryKey: ['turnos-abiertos-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('turnos')
        .select('*, perfiles(nombres, apellidos)')
        .eq('estado', 'abierto')
        .order('hora_inicio', { ascending: false });
        
      if (error) throw error;
      return data as TurnoConPerfil[];
    },
    enabled: isAdmin,
    refetchInterval: 30000
  })

  if (!session) return null

  if (isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 mt-4">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Users className="text-primary" size={24} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Monitor de Taller</h2>
            <p className="text-slate-600 text-sm mt-0.5">Operarios con turno activo en tiempo real.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingAdmin ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
              <Clock className="animate-spin text-slate-400 mb-3" size={32} />
              <span className="text-sm font-medium">Buscando operarios activos...</span>
            </div>
          ) : turnosGlobales?.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-slate-50">
              <Activity size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
              <p className="text-lg font-medium text-slate-700">El taller está vacío</p>
              <p className="text-sm mt-1">No hay trabajadores registrados en línea actualmente.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {turnosGlobales?.map((turno) => (
                <div key={turno.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex justify-center items-center font-bold text-lg border border-slate-200 shadow-sm" aria-hidden="true">
                      {turno.perfiles?.nombres?.charAt(0)}{turno.perfiles?.apellidos?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {turno.perfiles?.nombres} {turno.perfiles?.apellidos}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Clock size={14} className="text-slate-400" /> 
                        Entrada: {new Date(turno.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-md text-sm border border-emerald-200 flex items-center gap-2 self-start sm:self-auto shadow-sm">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true" />
                    En línea
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const iniciarTurno = async () => {
    setGuardando(true)
    try {
      const localId = crypto.randomUUID()
      const fechaActual = getLocalDateString(new Date()) 
      const horaInicio = new Date().toISOString()

      await db.turnos.add({
        local_id: localId,
        trabajador_id: session.user.id,
        fecha: fechaActual,
        hora_inicio: horaInicio,
        estado: 'abierto',
        sync_status: 'pending' 
      })
      
      toast.success("Turno local iniciado", {
        description: 'La sincronización se hará en segundo plano.'
      })
      triggerSync()
    } catch (error) {
      console.error(error)
      toast.error("Error al iniciar turno en el dispositivo")
    } finally {
      setGuardando(false)
    }
  }

  const finalizarTurno = async () => {
    if (!turnoActivo || !turnoActivo.id) return;
    
    setGuardando(true)
    try {
      const horaFin = new Date().toISOString()
      
      // INTEGRIDAD: Prevenir horas negativas si el usuario manipuló su reloj
      const duracion = calcularDuracionTurno(turnoActivo.hora_inicio, horaFin)

      await db.turnos.update(turnoActivo.id, {
        hora_fin: horaFin,
        total_horas: duracion,
        estado: 'cerrado',
        sync_status: 'pending' 
      })
      
      toast.success(`Turno cerrado`, {
        description: `Tiempo local registrado: ${duracion.toFixed(2)} hrs`
      })
      triggerSync()
    } catch (err) {
      console.error(err)
      toast.error("Error al cerrar turno")
    } finally {
      setGuardando(false)
    }
  }

  if (turnoActivo === undefined) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <Clock className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 md:p-8 bg-white rounded-xl shadow-sm mt-8 border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Control de Asistencia</h2>
        <p className="text-sm text-slate-600 mt-1.5">Registra estrictamente tu entrada y salida.</p>
      </div>

      <div 
        className={`p-6 rounded-lg mb-8 border transition-all ${
          turnoActivo 
            ? "bg-emerald-50 border-emerald-200 shadow-inner" 
            : "bg-slate-50 border-slate-200"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Clock size={28} className={turnoActivo ? "text-emerald-600" : "text-slate-400"} aria-hidden="true" />
          <span className={`text-xl font-bold tracking-tight ${turnoActivo ? "text-emerald-800" : "text-slate-700"}`}>
            {turnoActivo ? "Estás en Turno" : "Fuera de Turno"}
          </span>
        </div>
        <p className={`text-sm text-center font-medium ${turnoActivo ? "text-emerald-700" : "text-slate-500"}`}>
          {turnoActivo 
            ? "Tus operaciones registradas hoy contarán para tu pago." 
            : "Inicia tu turno antes de comenzar la producción."}
        </p>
      </div>

      <div className="space-y-4">
        {!turnoActivo ? (
          <button 
            onClick={iniciarTurno} 
            disabled={guardando} 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-md flex justify-center items-center transition-colors disabled:opacity-50 active:scale-[0.98] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {guardando ? <Clock className="animate-spin mr-2" size={20} /> : <PlayCircle className="mr-2" size={20} />}
            {guardando ? 'Procesando...' : 'Iniciar Turno Ahora'}
          </button>
        ) : (
          <button 
            onClick={finalizarTurno} 
            disabled={guardando} 
            className="w-full bg-white text-slate-900 hover:bg-slate-50 border-2 border-slate-200 font-bold py-4 rounded-md flex justify-center items-center transition-colors disabled:opacity-50 active:scale-[0.98] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
          >
            {guardando ? <Clock className="animate-spin mr-2 text-slate-500" size={20} /> : <StopCircle className="mr-2 text-slate-500" size={20} />}
            {guardando ? 'Procesando...' : 'Finalizar Turno de Hoy'}
          </button>
        )}
      </div>
    </div>
  )
}