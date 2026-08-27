import { describe, it, expect } from 'vitest'
import { calcularPagoTotal, calcularEficiencia, obtenerInicioSemana } from './metrics'

describe('Métricas de Dashboard', () => {
  it('✓ cálculo de pagos: multiplica correctamente manejando decimales', () => {
    expect(calcularPagoTotal(150, 0.12)).toBe(18.00)
    expect(calcularPagoTotal(-5, 0.10)).toBe(0) // Validación
  })

  it('✓ cálculo de eficiencia: previene división por cero', () => {
    expect(calcularEficiencia(50, 4)).toBe(12.50)
    expect(calcularEficiencia(50, 0)).toBe(0) // Fallback seguro
  })

  it('✓ cálculo de semanas: siempre retrocede al Lunes más cercano', () => {
    // Miércoles 26 de Agosto de 2026
    const miercoles = new Date(2026, 7, 26, 12, 0, 0)
    const lunes = obtenerInicioSemana(miercoles)
    
    expect(lunes.getDay()).toBe(1) // 1 = Lunes
    expect(lunes.getDate()).toBe(24) // Lunes fue 24
  })
})