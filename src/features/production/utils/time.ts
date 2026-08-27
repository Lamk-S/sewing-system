export function calcularDuracionTurno(horaInicioIso: string, horaFinIso: string): number {
  const inicio = new Date(horaInicioIso).getTime();
  const fin = new Date(horaFinIso).getTime();
  
  if (isNaN(inicio) || isNaN(fin)) return 0;
  
  const diffMs = fin - inicio;
  return Math.max(0, diffMs / 3600000);
}