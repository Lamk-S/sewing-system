import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import RegistroTrabajador from '../RegistroTrabajador'
import { db } from '../../../shared/lib/db'
import * as AuthProvider from '../../../shared/auth/AuthProvider'
import { toast } from 'sonner'
import type { Session } from '@supabase/supabase-js'

// Mock de Auth y Toast
vi.mock('../../../shared/auth/AuthProvider', async (importOriginal) => ({
  ...(await importOriginal() as object),
  useAuth: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe('RegistroTrabajador', () => {
  beforeEach(async () => {
    await db.turnos.clear()
    await db.registros_produccion.clear()
    await db.prendas.clear()
    await db.operaciones.clear()

    vi.mocked(AuthProvider.useAuth).mockReturnValue({
      session: { user: { id: 'worker-123' } } as unknown as Session,
      isAdmin: false,
      isAuthLoading: false,
      signOut: vi.fn(),
    })
  })

  it('✓ validaciones de producción: bloquea registro si no hay turno activo', async () => {
    renderWithProviders(<RegistroTrabajador />)
    
    // Dexie resolverá vacío, el turno activo será null
    const alerta = await screen.findByText(/Turno no iniciado/i)
    expect(alerta).toBeInTheDocument()
    
    const boton = screen.getByRole('button', { name: /Registrar Bulto/i })
    expect(boton).toBeDisabled()
  })

  it('✓ validaciones de producción: rechaza cantidades inválidas', async () => {
    // Furza un turno activo en IndexedDB
    await db.turnos.add({
      local_id: 'turno-1', trabajador_id: 'worker-123', fecha: '2026-08-26',
      hora_inicio: new Date().toISOString(), estado: 'abierto', sync_status: 'synced'
    })

    renderWithProviders(<RegistroTrabajador />)
    
    const inputCantidad = await screen.findByPlaceholderText('0')
    const form = inputCantidad.closest('form')
    
    // Simula escribir letras/negativos
    fireEvent.change(inputCantidad, { target: { value: '-5' } })
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('válida'))
    })
  })

  it('✓ creación de registros locales y comportamiento del formulario', async () => {
    // Seed mínimo
    await db.turnos.add({
      local_id: 'turno-1',
      trabajador_id: 'worker-123',
      fecha: '2026-08-26',
      hora_inicio: new Date().toISOString(),
      estado: 'abierto',
      sync_status: 'synced'
    })
    
    await db.prendas.add({ 
      id: 1, 
      codigo: 'POL-01', 
      nombre: 'Polo', 
      activo: true, 
      creado_en: new Date().toISOString()
    })
    
    await db.operaciones.add({ 
      id: 1, 
      prenda_id: 1, 
      nombre: 'Basta', 
      precio_fijo: 0.10, 
      activo: true, 
      tiempo_estimado_minutos: 1,
      creado_en: new Date().toISOString()
    })

    renderWithProviders(<RegistroTrabajador />)

    // Llenar formulario
    const prendaSelect = await screen.findByLabelText(/1. Prenda a trabajar/i)
    fireEvent.change(prendaSelect, { target: { value: '1' } })

    const opSelect = await screen.findByLabelText(/2. Operación realizada/i)
    fireEvent.change(opSelect, { target: { value: '1' } })

    const inputCantidad = screen.getByPlaceholderText('0')
    fireEvent.change(inputCantidad, { target: { value: '100' } })

    const form = inputCantidad.closest('form')
    fireEvent.submit(form!)

    // Validar estado de éxito y limpieza
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('guardado localmente'), expect.any(Object))
      expect(inputCantidad).toHaveValue(null) // Formulario se reseteó
    })

    // Validar que realmente se escribió en IndexedDB (Transición de estado inicial)
    const registrosLocales = await db.registros_produccion.toArray()
    expect(registrosLocales).toHaveLength(1)
    expect(registrosLocales[0].cantidad).toBe(100)
    expect(registrosLocales[0].sync_status).toBe('pending') // Nace como pendiente (offline)
  })
})