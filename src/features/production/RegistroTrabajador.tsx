import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../../shared/lib/supabase'
import { useProduction } from '../../shared/hooks/useProduction'
import { useAuth } from '../../shared/auth/useAuth'
import { toast } from 'sonner'
import { Plus, Minus, Save, Loader2, LogOut } from 'lucide-react'

export default function RegistroTrabajador() {
  const { session } = useAuth()
  const { prendas, operaciones, colores, loading } = useProduction()

  const [prendaSeleccionada, setPrendaSeleccionada] = useState<string>('')
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<string>('')
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const inicial = colores.reduce((acc, c) => {
        acc[c.id] = 0
        return acc
      }, {} as Record<number, number>)
      setCantidades(inicial)
    }, 0)

    return () => clearTimeout(timer)
  }, [colores])

  const valorTotal = useMemo(() => {
    if (!operacionSeleccionada) return 0
    const op = operaciones.find(o => o.id === Number(operacionSeleccionada))
    if (!op) return 0
    return Object.values(cantidades).reduce((sum, cant) => sum + cant * op.precio_fijo, 0)
  }, [operacionSeleccionada, cantidades, operaciones])

  const operacionesFiltradas = useMemo(() => {
    if (!prendaSeleccionada) return []
    return operaciones.filter(op => op.prenda_id === Number(prendaSeleccionada))
  }, [prendaSeleccionada, operaciones])

  if (!session) return <div>No autenticado</div>
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={32} /></div>

  const actualizarCantidad = (colorId: number, incremento: number) => {
    setCantidades(prev => ({
      ...prev,
      [colorId]: Math.max(0, (prev[colorId] || 0) + incremento)
    }))
  }

  const guardarRegistro = async () => {
    if (!prendaSeleccionada || !operacionSeleccionada) return toast.error("Selecciona prenda y operación")

    const registros = Object.entries(cantidades)
      .filter(([, cant]) => cant > 0)
      .map(([colorId, cantidad]) => ({
        operacion_id: Number(operacionSeleccionada),
        color_id: Number(colorId),
        cantidad,
        trabajador_id: session.user.id
      }))

    if (registros.length === 0) return toast.error("Ingresa al menos una cantidad mayor a cero")

    setGuardando(true)
    const { error } = await supabase.from('registros_produccion').insert(registros)
    setGuardando(false)

    if (error) return toast.error("Error al guardar producción")
    toast.success(`Se guardaron ${registros.length} registros`)

    setCantidades(colores.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {}))
    setOperacionSeleccionada('')
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-lg mt-6 border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">TIEMP - Producción</h2>
          <p className="text-xs text-gray-500">Registro de Operaciones</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-gray-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {/* Selección Prenda */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">1. Prenda</label>
        <select
          className="w-full p-3 border rounded-lg bg-gray-50"
          value={prendaSeleccionada}
          onChange={(e) => { setPrendaSeleccionada(e.target.value); setOperacionSeleccionada('') }}
        >
          <option value="">-- Selecciona Prenda --</option>
          {prendas.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
        </select>
      </div>

      {/* Selección Operación */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">2. Operación</label>
        <select
          className="w-full p-3 border rounded-lg bg-gray-50"
          value={operacionSeleccionada}
          onChange={e => setOperacionSeleccionada(e.target.value)}
          disabled={!prendaSeleccionada}
        >
          <option value="">-- Selecciona Operación --</option>
          {operacionesFiltradas.map(op => (
            <option key={op.id} value={op.id}>{op.nombre} (${op.precio_fijo})</option>
          ))}
        </select>
      </div>

      {/* Colores */}
      <div className="space-y-3 mb-8">
        <h3 className="text-sm font-semibold text-gray-600 uppercase">Cantidades por Color</h3>
        {colores.map(color => (
          <div key={color.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.codigo_hex || '#ccc' }} />
              <span className="font-medium text-gray-700">{color.nombre}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => actualizarCantidad(color.id, -1)} className="p-1.5 bg-white border rounded hover:bg-red-50 text-red-600"><Minus size={16} /></button>
              <span className="text-xl font-bold w-8 text-center">{cantidades[color.id] || 0}</span>
              <button onClick={() => actualizarCantidad(color.id, 1)} className="p-1.5 bg-white border rounded hover:bg-green-50 text-green-600"><Plus size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 flex justify-between items-center">
        <span className="text-sm text-blue-800">Valor Estimado del Lote</span>
        <span className="text-xl font-bold text-blue-900">${valorTotal.toFixed(2)}</span>
      </div>

      {/* Guardar */}
      <button
        onClick={guardarRegistro}
        disabled={guardando || !operacionSeleccionada}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg flex justify-center items-center"
      >
        {guardando ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
        {guardando ? 'Guardando...' : 'Guardar Producción'}
      </button>
    </div>
  )
}