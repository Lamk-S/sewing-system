import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../shared/auth/AuthProvider'
import { db } from '../../shared/lib/db'
import { supabase } from '../../shared/lib/supabase'
import { toast } from 'sonner'
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react'

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
      if (!session || isAdmin) return null; // El admin no busca turnos locales
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
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 30000 // Refresca automáticamente cada 30 segundos
  })

  if (!session) return <div>No autenticado</div>

  // VISTA 1: PANEL DE SUPERVISIÓN PARA ADMINISTRADOR
  if (isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-blue-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Monitor de Taller</h2>
            <p className="text-gray-500">Trabajadores con turno activo en este momento</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          {loadingAdmin ? (
             <div className="p-8 flex justify-center"><Clock className="animate-spin text-gray-400" /></div>
          ) : turnosGlobales?.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">El taller está vacío</p>
              <p className="text-sm">No hay trabajadores con turnos abiertos.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {turnosGlobales?.map((turno: TurnoConPerfil) => (
                <div key={turno.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex justify-center items-center font-bold">
                      {turno.perfiles?.nombres?.charAt(0)}{turno.perfiles?.apellidos?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {turno.perfiles?.nombres} {turno.perfiles?.apellidos}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} /> 
                        Inició: {new Date(turno.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 font-medium rounded-full text-sm animate-pulse">
                    Trabajando
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
  if (turnoActivo === undefined) return <div className="flex justify-center items-center py-10"><Clock className="animate-spin text-gray-500" size={28} /></div>

  const iniciarTurno = async () => {
    setGuardando(true)
    try {
      await db.turnos.add({
        local_id: crypto.randomUUID(),
        trabajador_id: session.user.id,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: new Date().toISOString(),
        estado: 'abierto',
        sync_status: 'pending' 
      })
      toast.success("Turno iniciado (Offline)")
    } catch (error) {
      console.error(error)
      toast.error("Error al iniciar turno localmente")
    } finally {
      setGuardando(false)
    }
  }

  const finalizarTurno = async () => {
    if (!turnoActivo || !turnoActivo.id) return;
    
    setGuardando(true)
    try {
      const duracion = (Date.now() - new Date(turnoActivo.hora_inicio).getTime()) / 3600000

      await db.turnos.update(turnoActivo.id, {
        hora_fin: new Date().toISOString(),
        total_horas: duracion,
        estado: 'cerrado',
        sync_status: 'pending' 
      })
      
      toast.success(`Turno cerrado: ${duracion.toFixed(2)} h (Offline)`)
    } catch (err) {
      console.error(err)
      toast.error("Error al cerrar turno localmente")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-lg mt-6 border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gestión de Turno</h2>
        <p className="text-sm text-gray-500">Control de tiempo de trabajo</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock size={24} className={turnoActivo ? "text-green-600" : "text-gray-400"} />
          <span className={`text-lg font-bold ${turnoActivo ? "text-green-600" : "text-gray-600"}`}>
            {turnoActivo ? "Turno Activo" : "Sin Turno"}
          </span>
        </div>
        {turnoActivo && <p className="text-sm text-gray-500 text-center">Inicia tu producción para calcular tu tarifa horaria</p>}
      </div>

      <div className="space-y-3">
        {!turnoActivo ? (
          <button onClick={iniciarTurno} disabled={guardando} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg flex justify-center items-center disabled:opacity-50">
            {guardando ? <Clock className="animate-spin mr-2" size={20} /> : <CheckCircle className="mr-2" size={20} />}
            {guardando ? 'Iniciando...' : 'Iniciar Turno'}
          </button>
        ) : (
          <button onClick={finalizarTurno} disabled={guardando} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg flex justify-center items-center disabled:opacity-50">
            {guardando ? <Clock className="animate-spin mr-2" size={20} /> : <XCircle className="mr-2" size={20} />}
            {guardando ? 'Cerrando...' : 'Finalizar Turno'}
          </button>
        )}
      </div>
    </div>
  )
}