import { useState, useEffect } from 'react'
import { supabase } from '../../shared/lib/supabase'
import { useAuth } from '../../shared/auth/useAuth'
import { toast } from 'sonner'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

export default function TurnoManager() {
  const { session } = useAuth()
  const [turnoAbierto, setTurnoAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return setLoading(false)

    const verificarTurno = async () => {
      const { data, error } = await supabase
        .from('turnos')
        .select('id')
        .eq('trabajador_id', session.user.id)
        .eq('estado', 'abierto')
        .maybeSingle()

      if (error) {
        console.error(error)
        toast.error("Error verificando turno")
      }

      setTurnoAbierto(!!data)
      setLoading(false)
    }

    verificarTurno()
  }, [session])

  if (!session) return <div>No autenticado</div>
  if (loading) return <div className="flex justify-center items-center py-10"><Clock className="animate-spin text-gray-500" size={28} /></div>

  const iniciarTurno = async () => {
    setGuardando(true)
    const { error } = await supabase.from('turnos').insert({
      trabajador_id: session.user.id,
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: new Date().toISOString(),
      estado: 'abierto'
    })
    setGuardando(false)

    if (error) return toast.error("Error al iniciar turno")
    toast.success("Turno iniciado")
    setTurnoAbierto(true)
  }

  const finalizarTurno = async () => {
    setGuardando(true)
    try {
      const { data: turno, error } = await supabase
        .from('turnos')
        .select('id, hora_inicio')
        .eq('trabajador_id', session.user.id)
        .eq('estado', 'abierto')
        .maybeSingle()

      if (error) throw error
      if (!turno) throw new Error("No hay turno abierto para cerrar")

      const duracion = (Date.now() - new Date(turno.hora_inicio).getTime()) / 3600000

      const { error: errorUpdate } = await supabase
        .from('turnos')
        .update({ hora_fin: new Date().toISOString(), total_horas: duracion, estado: 'cerrado' })
        .eq('id', turno.id)

      if (errorUpdate) throw errorUpdate
      toast.success(`Turno cerrado: ${duracion.toFixed(2)} h`)
      setTurnoAbierto(false)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Error desconocido")
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
          <Clock size={24} className={turnoAbierto ? "text-green-600" : "text-gray-400"} />
          <span className={`text-lg font-bold ${turnoAbierto ? "text-green-600" : "text-gray-600"}`}>
            {turnoAbierto ? "Turno Activo" : "Sin Turno"}
          </span>
        </div>
        {turnoAbierto && <p className="text-sm text-gray-500 text-center">Inicia tu producción para calcular tu tarifa horaria</p>}
      </div>

      <div className="space-y-3">
        {!turnoAbierto ? (
          <button onClick={iniciarTurno} disabled={guardando} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg flex justify-center items-center">
            {guardando ? <Clock className="animate-spin mr-2" size={20} /> : <CheckCircle className="mr-2" size={20} />}
            {guardando ? 'Iniciando...' : 'Iniciar Turno'}
          </button>
        ) : (
          <button onClick={finalizarTurno} disabled={guardando} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg flex justify-center items-center">
            {guardando ? <Clock className="animate-spin mr-2" size={20} /> : <XCircle className="mr-2" size={20} />}
            {guardando ? 'Cerrando...' : 'Finalizar Turno'}
          </button>
        )}
      </div>
    </div>
  )
}