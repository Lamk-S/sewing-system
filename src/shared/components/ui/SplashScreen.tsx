import { Loader2 } from 'lucide-react'

export function SplashScreen({ message = 'Iniciando sistema...' }: { message?: string }) {
  return (
    <div 
      role="status" 
      aria-live="polite"
      className="fixed inset-0 z-100 bg-slate-50 flex flex-col items-center justify-center animate-in fade-in duration-300"
    >
      <div className="relative">
        <img 
          src="/favicon.svg" 
          alt="Logo LamkSew"
          width={96}
          height={96}
          className="w-24 h-24 mb-6 motion-safe:animate-pulse"
          onError={(e) => { e.currentTarget.src = "/pwa-192x192.png" }}
        />
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full border-t-primary motion-safe:animate-spin -m-4"></div>
      </div>
      
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">LamkSew</h2>
      
      <div className="flex items-center gap-2 mt-4 text-slate-500">
        <Loader2 className="motion-safe:animate-spin w-4 h-4" aria-hidden="true" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}