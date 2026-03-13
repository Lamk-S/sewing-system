import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { BarChart, DollarSign, Clock } from 'lucide-react';
import type { Tables } from '../../types/supabase';

type ResumenDiario = Tables<'v_resumen_diario'>;
type ResumenSemanal = Tables<'v_resumen_semanal'>;
type TarifaHoraria = Tables<'v_tarifa_horaria'>;

export default function Dashboard() {
  const { session } = useAuth();
  const [resumenDiario, setResumenDiario] = useState<ResumenDiario[]>([]);
  const [resumenSemanal, setResumenSemanal] = useState<ResumenSemanal[]>([]);
  const [tarifaHoraria, setTarifaHoraria] = useState<TarifaHoraria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarReportes = async () => {
      if (!session?.user?.email) return;
      setLoading(true);

      const [resDiario, resSemanal, resTarifa] = await Promise.all([
        supabase.from('v_resumen_diario').select('*').eq('nombre_completo', session.user.email),
        supabase.from('v_resumen_semanal').select('*').eq('nombre_completo', session.user.email),
        supabase.from('v_tarifa_horaria').select('*').eq('nombre_completo', session.user.email)
      ]);

      if (resDiario.data) setResumenDiario(resDiario.data);
      if (resSemanal.data) setResumenSemanal(resSemanal.data);
      if (resTarifa.data) setTarifaHoraria(resTarifa.data);
      setLoading(false);
    };
    cargarReportes();
  }, [session]);

  if (loading) return <div className="p-4 text-center">Cargando reportes...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard de Producción</h2>

      {/* Resumen Diario */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-gray-700">Resumen Diario</h3>
        </div>
        {resumenDiario.length === 0 ? (
          <p className="text-gray-500 text-center">No hay registros hoy</p>
        ) : (
          <div className="space-y-2">
            {resumenDiario.map((item) => (
              <div key={item.fecha_trabajo} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{item.fecha_trabajo}</span>
                <span className="text-gray-700">{item.total_piezas} piezas</span>
                <span className="font-bold text-green-600">${(item.total_ganado || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tarifa Horaria */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-orange-600" size={24} />
          <h3 className="text-lg font-bold text-gray-700">Tarifa Horaria Real</h3>
        </div>
        {tarifaHoraria.length === 0 ? (
          <p className="text-gray-500 text-center">No hay turnos cerrados</p>
        ) : (
          <div className="space-y-2">
            {tarifaHoraria.map((item) => (
              <div key={item.fecha} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{item.fecha}</span>
                <span className="text-gray-700">{item.total_horas} horas</span>
                <span className="font-bold text-orange-600">${(item.tarifa_horaria_real || 0).toFixed(2)}/hora</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen Semanal */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="text-green-600" size={24} />
          <h3 className="text-lg font-bold text-gray-700">Resumen Semanal</h3>
        </div>
        {resumenSemanal.length === 0 ? (
          <p className="text-gray-500 text-center">No hay datos esta semana</p>
        ) : (
          <div className="space-y-2">
            {resumenSemanal.map((item) => (
              <div key={item.semana_inicio} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{item.semana_inicio}</span>
                <span className="text-gray-700">{item.total_piezas} piezas</span>
                <span className="font-bold text-green-600">${(item.total_ganado || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}