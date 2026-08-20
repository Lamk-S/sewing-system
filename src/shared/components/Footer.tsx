export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 mt-auto border-t border-slate-200 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Información del Sistema */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="text-sm font-bold text-slate-800 tracking-tight">
            Sistema de Gestión de Producción
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            © {currentYear} Todos los derechos reservados.
          </p>
        </div>

        {/* Firma corporativa Lamk-S */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Elaborado por
          </span>
          <span className="text-sm font-black text-primary tracking-wide">
            LAMK-S
          </span>
        </div>

      </div>
    </footer>
  )
}