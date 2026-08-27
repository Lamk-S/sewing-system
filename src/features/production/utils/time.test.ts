import { describe, it, expect } from 'vitest'
import { calcularDuracionTurno } from './time'

describe('calcularDuracionTurno', () => {
  it('calcula correctamente horas enteras', () => {
    const inicio = '2026-08-26T08:00:00.000Z'
    const fin = '2026-08-26T12:00:00.000Z'
    expect(calcularDuracionTurno(inicio, fin)).toBe(4)
  })

  it('previene horas negativas si se manipula el reloj hacia atrás', () => {
    const inicio = '2026-08-26T12:00:00.000Z'
    const fin = '2026-08-26T08:00:00.000Z'
    expect(calcularDuracionTurno(inicio, fin)).toBe(0)
  })
})