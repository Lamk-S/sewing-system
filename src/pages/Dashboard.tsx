import { useMemo } from 'react'
import { useAuth } from '../shared/auth/AuthProvider'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../shared/lib/db'
import { Clock, DollarSign, Calendar, TrendingUp, type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  icon: LucideIcon
  value: string | number
  subtitle?: string
  highlight?: boolean
}

const MetricCard = ({ title, icon: Icon, value, subtitle, highlight = false }: MetricCardProps) => (
  <div className={`bg-white rounded-xl shadow-sm border ${highlight ? 'border-primary/30 ring-1 ring-primary/10' : 'border-slate-200'} p-5 flex flex-col h-full`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${highlight ? 'bg-primary text-white shadow-sm' : 'bg-primary/10 text-primary'}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <h3 className="font-bold text-slate-800">{title}</h3>
    </div>
    <div className="mt-auto">
      <p className={`text-3xl font-black tracking-tight ${highlight ? 'text-primary' : 'text-slate-900'}`}>
        {value}
      </p>
      {subtitle && <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>}
    </div>
  </div>
)

// Garantiza formato YYYY-MM-DD en la zona horaria de Perú
const getLocalDateString = (date: Date) => {
  return date.toLocaleDateString('en-CA', { 
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'
  });
}

export default function Dashboard() {
  const { session } = useAuth()
  
  const operacionesData = useLiveQuery(() => db.operaciones.toArray(), [])
  const operacionesMap = useMemo(() => {
    return new Map(operacionesData?.map(op => [op.id, op]) || [])
  }, [operacionesData])

  const metricas = useLiveQuery(async () => {
    if (!session?.user?.id || !operacionesMap.size) return null;
    
    const userId = session.user.id;
    const ahora = new Date();

    // Fecha segura en zona horaria local (Perú)
    const fechaHoy = getLocalDateString(ahora);
    
    // Calcular inicio de semana (Lunes)
    const diaSemana = ahora.getDay();
    const difLunes = ahora.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const dateLunes = new Date(ahora.getTime());
    dateLunes.setDate(difLunes);
    const fechaInicioSemana = getLocalDateString(dateLunes);

    // Consultas paralelas
    const [registros, turnos] = await Promise.all([
      db.registros_produccion.where('trabajador_id').equals(userId).toArray(),
      db.turnos.where('trabajador_id').equals(userId).toArray()
    ]);

    // Calcular Diario
    const registrosHoy = registros.filter(r => r.fecha_trabajo === fechaHoy);
    const ganadoHoy = registrosHoy.reduce((acc, r) => {
      const op = operacionesMap.get(r.operacion_id!);
      return acc + ((r.cantidad || 0) * (op?.precio_fijo || 0));
    }, 0);
    const piezasHoy = registrosHoy.reduce((acc, r) => acc + (r.cantidad || 0), 0);

    // Calcular Semanal
    const registrosSemana = registros.filter(r => r.fecha_trabajo! >= fechaInicioSemana);
    const ganadoSemana = registrosSemana.reduce((acc, r) => {
      const op = operacionesMap.get(r.operacion_id!);
      return acc + ((r.cantidad || 0) * (op?.precio_fijo || 0));
    }, 0);

    // Calcular Tarifa Horaria de HOY
    const turnosHoy = turnos.filter(t => t.fecha === fechaHoy && t.estado === 'cerrado');
    const horasHoy = turnosHoy.reduce((acc, t) => acc + (t.total_horas || 0), 0);
    const tarifaHoraria = horasHoy > 0 ? (ganadoHoy / horasHoy) : 0;

    return {
      ganadoHoy,
      piezasHoy,
      ganadoSemana,
      horasHoy,
      tarifaHoraria
    }
  }, [session?.user?.id, operacionesMap]) 

  if (!metricas) {
    return (
      <div className="flex justify-center py-20 text-slate-500 animate-in fade-in">
        <p className="font-medium text-sm">Calculando tus métricas...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 animate-in fade-in duration-300">
      
      <div className="mb-6 md:mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Mi Rendimiento</h1>
        <p className="text-slate-500 text-sm md:text-base mt-1">
          Resumen de tu productividad basado en registros locales.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
        
        <MetricCard 
          title="Ganancia Hoy" 
          icon={DollarSign} 
          value={`$${metricas.ganadoHoy.toFixed(2)}`}
          subtitle={`${metricas.piezasHoy} piezas producidas`}
          highlight={true}
        />

        <MetricCard 
          title="Tarifa Horaria Real" 
          icon={Clock} 
          value={`$${metricas.tarifaHoraria.toFixed(2)} / hr`}
          subtitle={`Basado en ${metricas.horasHoy.toFixed(1)} hrs trabajadas`}
        />

        <MetricCard 
          title="Ingreso Semanal" 
          icon={TrendingUp} 
          value={`$${metricas.ganadoSemana.toFixed(2)}`}
          subtitle="Acumulado desde el Lunes"
        />

        <MetricCard 
          title="Horas Hoy" 
          icon={Calendar} 
          value={`${metricas.horasHoy.toFixed(1)} hrs`}
          subtitle="Turnos completados"
        />

      </div>
    </div>
  )
}