import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function TurnoManager({ session }: { session: Session }) {
  const [turnoAbierto, setTurnoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const iniciarTurno = async () => {
    setGuardando(true);
    const { error } = await supabase.from('turnos').insert({
      trabajador_id: session.user.id,
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: new Date().toISOString(),
      estado: 'abierto'
    });
    setGuardando(false);
    if (error) toast.error("Error al iniciar turno");
    else {
      toast.success("Turno iniciado");
      setTurnoAbierto(true);
    }
  };

  const finalizarTurno = async () => {
    setGuardando(true);
    const { data: turno } = await supabase
      .from('turnos')
      .select('id, hora_inicio')
      .eq('trabajador_id', session.user.id)
      .eq('estado', 'abierto')
      .single();

    if (!turno) {
      setGuardando(false);
      toast.error("No hay turno abierto para cerrar");
      return;
    }

    const duracion = (new Date().getTime() - new Date(turno.hora_inicio).getTime()) / 3600000;
    
    const { error } = await supabase
      .from('turnos')
      .update({ 
        hora_fin: new Date().toISOString(),
        total_horas: duracion,
        estado: 'cerrado'
      })
      .eq('id', turno.id);

    setGuardando(false);
    if (error) toast.error("Error al cerrar turno");
    else {
      toast.success(`Turno cerrado. Duración: ${duracion.toFixed(2)} horas`);
      setTurnoAbierto(false);
    }
  };

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
        {turnoAbierto && (
          <p className="text-sm text-gray-500 text-center">
            Inicia tu producción para calcular tu tarifa horaria
          </p>
        )}
      </div>

      <div className="space-y-3">
        {!turnoAbierto ? (
          <button 
            onClick={iniciarTurno} 
            disabled={guardando}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg flex justify-center items-center shadow-md transition-all active:scale-95 disabled:opacity-70"
          >
            {guardando ? (
              <Clock className="animate-spin mr-2" size={20} />
            ) : (
              <CheckCircle className="mr-2" size={20} />
            )}
            {guardando ? 'Iniciando...' : 'Iniciar Turno'}
          </button>
        ) : (
          <button 
            onClick={finalizarTurno} 
            disabled={guardando}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg flex justify-center items-center shadow-md transition-all active:scale-95 disabled:opacity-70"
          >
            {guardando ? (
              <Clock className="animate-spin mr-2" size={20} />
            ) : (
              <XCircle className="mr-2" size={20} />
            )}
            {guardando ? 'Cerrando...' : 'Finalizar Turno'}
          </button>
        )}
      </div>
    </div>
  );
}