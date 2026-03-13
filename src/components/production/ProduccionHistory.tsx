import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import type { Tables } from '../../types/supabase';

type RegistroProduccion = Tables<'registros_produccion'> & {
  operaciones: { nombre: string; precio_fijo: number };
  colores: { nombre: string; codigo_hex: string | null };
};

export default function ProduccionHistory() {
  const { session } = useAuth();
  const [historial, setHistorial] = useState<RegistroProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGanado, setTotalGanado] = useState(0);

  useEffect(() => {
    const cargarHistorial = async () => {
      if (!session) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('registros_produccion')
        .select(`
          *,
          operaciones (nombre, precio_fijo),
          colores (nombre, codigo_hex)
        `)
        .eq('trabajador_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        toast.error("Error al cargar historial");
      } else if (data) {
        setHistorial(data);
        const total = data.reduce((sum: number, item: RegistroProduccion) => 
          sum + (item.cantidad * item.operaciones.precio_fijo), 0
        );
        setTotalGanado(total);
      }
      setLoading(false);
    };
    cargarHistorial();
  }, [session]);

  if (loading) return <div className="p-4 text-center">Cargando historial...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Historial de Producción</h2>
        <div className="bg-green-100 px-4 py-2 rounded-lg">
          <span className="text-green-800 font-bold">Total: ${totalGanado.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {historial.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay registros de producción</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {historial.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{item.operaciones.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {item.colores.nombre} • {item.cantidad} piezas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ${(item.cantidad * item.operaciones.precio_fijo).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}