import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '../../shared/auth/useAuth'
import { db } from '../../shared/lib/db'
import { toast } from 'sonner'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

export default function TurnoManager() {
  const { session } = useAuth()
  const [guardando, setGuardando] = useState(false)

  const turnoActivo = useLiveQuery(
    () => {
      if (!session) return undefined;
      return db.turnos
        .where('trabajador_id').equals(session.user.id)
        .filter(t => t.estado === 'abierto')
        .first();
    },
    [session]
  )

  if (!session) return <div>No autenticado</div>
  
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