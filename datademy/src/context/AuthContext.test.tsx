import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { setGoogleToken, clearGoogleToken } from '../services/googleToken.ts'

vi.mock('../services/googleToken.ts', () => ({
  setGoogleToken: vi.fn(),
  clearGoogleToken: vi.fn(),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

let respuestaGoogleToken: any
let respuestaMe: any

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    if (url.includes('/auth/google-token')) {
      return { ok: true, json: async () => respuestaGoogleToken } as Response
    }
    if (url.includes('/auth/me')) {
      return { ok: true, json: async () => respuestaMe } as Response
    }
    if (url.includes('/auth/logout')) {
      return { ok: true, json: async () => ({ estado: 'exito' }) } as Response
    }
    return { ok: false, json: async () => ({}) } as Response
  }))
}

describe('AuthContext', () => {
  beforeEach(() => {
    respuestaGoogleToken = { estado: 'error' }
    respuestaMe = { estado: 'error' }
    stubFetch()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  // --- Estos 4 tests no tocan el intervalo de 5 min: timers reales, waitFor normal ---

  it('al montar, si el token de Google es válido, autentica y carga el usuario', async () => {
    respuestaGoogleToken = { estado: 'exito', googleAccessToken: 'tok-123' }
    respuestaMe = { estado: 'exito', usuario: { userId: '1', correo: 'a@a.com', rol: 'profesor' } }

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.usuario?.correo).toBe('a@a.com')
    expect(result.current.esAdmin).toBe(false)
    expect(setGoogleToken).toHaveBeenCalledWith('tok-123')
  })

  it('esAdmin es true cuando el rol del usuario es admin', async () => {
    respuestaGoogleToken = { estado: 'exito', googleAccessToken: 'tok-123' }
    respuestaMe = { estado: 'exito', usuario: { userId: '1', correo: 'admin@a.com', rol: 'admin' } }

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.esAdmin).toBe(true)
  })

  it('REGRESIÓN: si el chequeo inicial falla, NO dispara google-session-expired (todavía no había sesión)', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    respuestaGoogleToken = { estado: 'error' }

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).not.toContain('google-session-expired')
  })

  it('cerrarSesion limpia el estado local y pega al endpoint de logout', async () => {
    respuestaGoogleToken = { estado: 'exito', googleAccessToken: 'tok-123' }
    respuestaMe = { estado: 'exito', usuario: { userId: '1', correo: 'a@a.com', rol: 'profesor' } }

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    await act(async () => {
      await result.current.cerrarSesion()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.usuario).toBeNull()
    expect(clearGoogleToken).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  // --- Estos 2 SÍ necesitan avanzar el intervalo de 5 min: fake timers, sin waitFor ---

  it('si el chequeo periódico falla después de haber estado autenticado, dispara google-session-expired', async () => {
    vi.useFakeTimers()
    respuestaGoogleToken = { estado: 'exito', googleAccessToken: 'tok-123' }
    respuestaMe = { estado: 'exito', usuario: { userId: '1', correo: 'a@a.com', rol: 'profesor' } }

    const { result } = renderHook(() => useAuth(), { wrapper })

    // en vez de waitFor, flusheamos manualmente las promesas del montaje inicial
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(result.current.isAuthenticated).toBe(true)

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    respuestaGoogleToken = { estado: 'error' } // el token de Google expira

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })

    expect(result.current.isAuthenticated).toBe(false)
    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).toContain('google-session-expired')
  })

  it('si el chequeo periódico sigue siendo exitoso, no dispara ningún evento', async () => {
    vi.useFakeTimers()
    respuestaGoogleToken = { estado: 'exito', googleAccessToken: 'tok-123' }
    respuestaMe = { estado: 'exito', usuario: { userId: '1', correo: 'a@a.com', rol: 'profesor' } }

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(result.current.isAuthenticated).toBe(true)

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })

    expect(result.current.isAuthenticated).toBe(true)
    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).not.toContain('google-session-expired')
  })
})