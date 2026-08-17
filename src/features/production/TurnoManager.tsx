import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../shared/auth/AuthProvider'
import { db } from '../../shared/lib/db'
import { supabase } from '../../shared/lib/supabase'
import { toast } from 'sonner'
import { Clock, CheckCircle, StopCircle, Users } from 'lucide-react'

type TurnoConPerfil = {
  id: number;
  hora_inicio: string;
  perfiles: {
    nombres: string;
    apellidos: string;
  } | null;
}

export default function TurnoManager() {
  const { session, isAdmin } = useAuth()
  const [guardando, setGuardando] = useState(false)

  // ==========================================
  // LÓGICA DEL TRABAJADOR (OFFLINE/DEXIE)
  // ==========================================
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

  // ==========================================
  // LÓGICA DEL ADMINISTRADOR (ONLINE/SUPABASE)
  // ==========================================
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

  // VISTA 1: PANEL DE SUPERVISIÓN PARA ADMINISTRADOR
  if (isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-primary" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Monitor de Taller</h2>
            <p className="text-slate-500">Trabajadores con turno activo en este momento</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          {loadingAdmin ? (
             <div className="p-12 flex justify-center"><Clock className="animate-spin text-slate-400" size={32} /></div>
          ) : turnosGlobales?.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-slate-50">
              <Clock size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
              <p className="text-lg font-medium text-slate-700">El taller está vacío</p>
              <p className="text-sm">No hay trabajadores con turnos abiertos en este instante.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {turnosGlobales?.map((turno) => (
                <div key={turno.id} className="p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex justify-center items-center font-bold text-lg border border-blue-100 shadow-sm">
                      {turno.perfiles?.nombres?.charAt(0)}{turno.perfiles?.apellidos?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {turno.perfiles?.nombres} {turno.perfiles?.apellidos}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock size={14} /> 
                        Inició: {new Date(turno.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full text-sm border border-emerald-200 flex items-center gap-2 self-start sm:self-auto">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
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

  // VISTA 2: PANEL DE OPERACIÓN PARA TRABAJADOR
  if (turnoActivo === undefined) return <div className="flex justify-center items-center py-20"><Clock className="animate-spin text-slate-400" size={32} /></div>

  const iniciarTurno = async () => {
    setGuardando(true)
    try {
      const localId = crypto.randomUUID()
      const fechaActual = new Date().toISOString().split('T')[0]
      const horaInicio = new Date().toISOString()

      let isSynced = false
      if (navigator.onLine) {
        const { error } = await supabase.from('turnos').insert([{
          local_id: localId,
          trabajador_id: session.user.id,
          fecha: fechaActual,
          hora_inicio: horaInicio,
          estado: 'abierto'
        }])
        if (!error) isSynced = true
      }

      await db.turnos.add({
        local_id: localId,
        trabajador_id: session.user.id,
        fecha: fechaActual,
        hora_inicio: horaInicio,
        estado: 'abierto',
        sync_status: isSynced ? 'synced' : 'pending' 
      })
      toast.success(isSynced ? "Turno iniciado en la Nube" : "Turno iniciado (Modo Offline)")
    } catch (error) {
      console.error(error)
      toast.error("Error al iniciar turno")
    } finally {
      setGuardando(false)
    }
  }

  const finalizarTurno = async () => {
    if (!turnoActivo || !turnoActivo.local_id) return;
    
    setGuardando(true)
    try {
      const horaFin = new Date().toISOString()
      const duracion = (new Date(horaFin).getTime() - new Date(turnoActivo.hora_inicio).getTime()) / 3600000

      let isSynced = false
      if (navigator.onLine) {
        const { error } = await supabase.from('turnos')
          .update({ hora_fin: horaFin, total_horas: duracion, estado: 'cerrado' })
          .eq('local_id', turnoActivo.local_id)
        
        if (!error) isSynced = true
      }

      if (turnoActivo.id) {
        await db.turnos.update(turnoActivo.id, {
          hora_fin: horaFin,
          total_horas: duracion,
          estado: 'cerrado',
          sync_status: isSynced ? 'synced' : 'pending' 
        })
      }
      
      toast.success(`Turno finalizado: ${duracion.toFixed(2)} hrs`)
    } catch (err) {
      console.error(err)
      toast.error("Error al cerrar turno")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-5 bg-white rounded-2xl shadow-sm mt-6 md:mt-10 border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Control de Asistencia</h2>
        <p className="text-sm text-slate-500 mt-1">Registra tus horas de entrada y salida</p>
      </div>

      <div className={`p-5 rounded-xl mb-8 border transition-colors ${
        turnoActivo ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Clock size={28} className={turnoActivo ? "text-emerald-600" : "text-slate-400"} />
          <span className={`text-xl font-bold ${turnoActivo ? "text-emerald-700" : "text-slate-600"}`}>
            {turnoActivo ? "Estás en Turno" : "Fuera de Turno"}
          </span>
        </div>
        {turnoActivo ? (
           <p className="text-sm text-emerald-600 font-medium text-center">
             Tus operaciones de hoy calcularán tu tarifa horaria.
           </p>
        ) : (
           <p className="text-sm text-slate-500 text-center">
             Inicia tu turno antes de registrar producción.
           </p>
        )}
      </div>

      <div className="space-y-3">
        {!turnoActivo ? (
          <button 
            onClick={iniciarTurno} 
            disabled={guardando} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex justify-center items-center transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
          >
            {guardando ? <Clock className="animate-spin mr-2" size={20} /> : <CheckCircle className="mr-2" size={20} />}
            {guardando ? 'Procesando...' : 'Iniciar Turno'}
          </button>
        ) : (
          <button 
            onClick={finalizarTurno} 
            disabled={guardando} 
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
          >
            {guardando ? <Clock className="animate-spin mr-2" size={20} /> : <StopCircle className="mr-2" size={20} />}
            {guardando ? 'Procesando...' : 'Finalizar Turno de Hoy'}
          </button>
        )}
      </div>
    </div>
  )
}