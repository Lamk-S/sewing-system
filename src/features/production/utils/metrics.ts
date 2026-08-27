export function calcularPagoTotal(cantidad: number, precioFijo: number): number {
  if (cantidad < 0 || precioFijo < 0) return 0;
  return Number((cantidad * precioFijo).toFixed(2));
}

export function calcularEficiencia(totalGanado: number, totalHoras: number): number {
  if (totalHoras <= 0) return 0;
  return Number((totalGanado / totalHoras).toFixed(2));
}

export function obtenerInicioSemana(fechaActual: Date): Date {
  const diaSemana = fechaActual.getDay();
  // Ajuste para que el Lunes sea el inicio (0 es Domingo)
  const difLunes = fechaActual.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const fechaLunes = new Date(fechaActual.getTime());
  fechaLunes.setDate(difLunes);
  fechaLunes.setHours(0, 0, 0, 0);
  return fechaLunes;
}