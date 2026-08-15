import { Loader2 } from 'lucide-react'

export function SplashScreen({ message = 'Iniciando sistema...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-100 bg-slate-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative">
        <img 
          src="/favicon.svg" 
          alt="Cargando LamkSew" 
          className="w-24 h-24 mb-6 animate-pulse"
          onError={(e) => { e.currentTarget.src = "/pwa-192x192.png" }}
        />
        {/* Spinner decorativo alrededor del logo */}
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full border-t-primary animate-spin -m-4"></div>
      </div>
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">LamkSew</h2>
      <div className="flex items-center gap-2 mt-4 text-slate-500">
        <Loader2 className="animate-spin w-4 h-4" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}