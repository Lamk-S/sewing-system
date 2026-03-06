import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Plus, Minus, Save, Loader2, LogOut } from 'lucide-react';

const COLORES_DISPONIBLES = ['Negro', 'Rojo', 'Celeste', 'Blanco', 'Azul Marino'];

export default function RegistroTrabajador({ session }: { session: Session }) {
  const [operaciones, setOperaciones] = useState<{id: number, nombre: string}[]>([]);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState('');
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    COLORES_DISPONIBLES.reduce((acc, color) => ({ ...acc, [color]: 0 }), {})
  );
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarOperaciones = async () => {
      const { data } = await supabase.from('operaciones').select('id, nombre').eq('activo', true);
      if (data) setOperaciones(data);
    };
    cargarOperaciones();
  }, []);

  const actualizarCantidad = (color: string, incremento: number) => {
    setCantidades(prev => ({ ...prev, [color]: Math.max(0, prev[color] + incremento) }));
  };

  const guardarRegistro = async () => {
    if (!operacionSeleccionada) return alert("Selecciona una operación.");
    setGuardando(true);

    const registrosAInsertar = Object.entries(cantidades)
      .filter((item) => item[1] > 0)
      .map(([color, cantidad]) => ({
        operacion_id: parseInt(operacionSeleccionada),
        color: color,
        cantidad: cantidad,
        trabajador_id: session.user.id,
      }));

    if (registrosAInsertar.length === 0) {
      setGuardando(false);
      return alert("Ingresa al menos una cantidad.");
    }

    const { error } = await supabase.from('registros_produccion').insert(registrosAInsertar);
    
    if (error) alert("Error al guardar.");
    else {
      alert("¡Guardado con éxito!");
      setCantidades(COLORES_DISPONIBLES.reduce((acc, c) => ({ ...acc, [c]: 0 }), {}));
    }
    setGuardando(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-md mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">TIEMP - Producción</h2>
        <button onClick={() => supabase.auth.signOut()} className="text-red-500 hover:text-red-700">
          <LogOut size={24} />
        </button>
      </div>

      <select 
        className="w-full p-3 border rounded-lg bg-gray-50 mb-6"
        value={operacionSeleccionada}
        onChange={(e) => setOperacionSeleccionada(e.target.value)}
      >
        <option value="">-- Operación --</option>
        {operaciones.map((op) => <option key={op.id} value={op.id}>{op.nombre}</option>)}
      </select>

      <div className="space-y-4 mb-8">
        {COLORES_DISPONIBLES.map((color) => (
          <div key={color} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
            <span className="font-medium text-lg w-1/3">{color}</span>
            <div className="flex items-center space-x-4">
              <button onClick={() => actualizarCantidad(color, -1)} className="p-2 bg-red-100 text-red-600 rounded-full"><Minus size={24} /></button>
              <span className="text-2xl font-bold w-8 text-center">{cantidades[color]}</span>
              <button onClick={() => actualizarCantidad(color, 1)} className="p-2 bg-green-100 text-green-600 rounded-full"><Plus size={24} /></button>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={guardarRegistro} disabled={guardando}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg flex justify-center items-center"
      >
        {guardando ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
        Guardar
      </button>
    </div>
  );
}