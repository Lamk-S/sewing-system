import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import TurnoManager from '../TurnoManager'
import { db } from '../../../shared/lib/db'
import * as AuthProvider from '../../../shared/auth/AuthProvider'
import type { Session } from '@supabase/supabase-js'

// Se mockea el hook de auth
vi.mock('../../../shared/auth/AuthProvider', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as object,
    useAuth: vi.fn(),
  }
})

describe('TurnoManager (Trabajador)', () => {
  beforeEach(async () => {
    // Se limpia la BD de Dexie antes de cada test
    await db.turnos.clear()
    vi.mocked(AuthProvider.useAuth).mockReturnValue({
        session: { user: { id: 'worker-123' } } as unknown as Session,
        isAdmin: false,
        isAuthLoading: false,
        signOut: vi.fn(),
    })
  })

  it('muestra el botón de Iniciar Turno si no hay turnos abiertos', async () => {
    renderWithProviders(<TurnoManager />)
    
    // Dexie / useLiveQuery es asíncrono, se espera al estado renderizado
    const btnIniciar = await screen.findByRole('button', { name: /iniciar turno/i })
    expect(btnIniciar).toBeInTheDocument()
    
    const statusText = screen.getByText(/Fuera de Turno/i)
    expect(statusText).toBeInTheDocument()
  })

  it('muestra el botón de Finalizar Turno si ya hay un turno activo', async () => {
    // Se simula un turno abierto en Dexie
    await db.turnos.add({
      local_id: 'test-local-id',
      trabajador_id: 'worker-123',
      fecha: '2026-08-26',
      hora_inicio: new Date().toISOString(),
      estado: 'abierto',
      sync_status: 'pending'
    })

    renderWithProviders(<TurnoManager />)
    
    const btnFinalizar = await screen.findByRole('button', { name: /finalizar turno/i })
    expect(btnFinalizar).toBeInTheDocument()
    
    const statusText = screen.getByText(/Estás en Turno/i)
    expect(statusText).toBeInTheDocument()
  })
})