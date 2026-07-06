import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('interceptorSesion', () => {
  let fetchOriginalMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api')
    fetchOriginalMock = vi.fn()
    vi.stubGlobal('fetch', fetchOriginalMock)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  async function instalar() {
    const mod = await import('./interceptorSesion')
    mod.instalarInterceptorSesion()
  }

  function mockRespuesta(status: number) {
    fetchOriginalMock.mockResolvedValue({ status, ok: status < 400 } as Response)
  }

  it('dispara google-session-expired en un 401 de una ruta no excluida', async () => {
    await instalar()
    mockRespuesta(401)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await fetch(`${import.meta.env.VITE_API_URL}/formularios/listar`)

    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).toContain('google-session-expired')
  })

  it('NO dispara nada en un 401 de /auth/google-token (ruta excluida)', async () => {
    await instalar()
    mockRespuesta(401)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await fetch(`${import.meta.env.VITE_API_URL}/auth/google-token`)

    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).not.toContain('google-session-expired')
  })

  it('NO dispara nada en un 401 de /auth/logout (ruta excluida)', async () => {
    await instalar()
    mockRespuesta(401)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`)

    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).not.toContain('google-session-expired')
  })

  it('dispara proceso-eliminado en un 404 que coincide con el idProceso activo', async () => {
    sessionStorage.setItem('idProceso', 'abc123')
    await instalar()
    mockRespuesta(404)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await fetch(`${import.meta.env.VITE_API_URL}/estadisticas/abc123/metricas`)

    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).toContain('proceso-eliminado')
  })

  it('NO dispara proceso-eliminado si el 404 es de un proceso distinto al activo', async () => {
    sessionStorage.setItem('idProceso', 'abc123')
    await instalar()
    mockRespuesta(404)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await fetch(`${import.meta.env.VITE_API_URL}/estadisticas/otro-proceso-999/metricas`)

    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).not.toContain('proceso-eliminado')
  })

  it('NO dispara proceso-eliminado en un 404 si no hay ningún idProceso activo guardado', async () => {
    await instalar() // sessionStorage vacío, sin setItem
    mockRespuesta(404)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await fetch(`${import.meta.env.VITE_API_URL}/estadisticas/abc123/metricas`)

    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).not.toContain('proceso-eliminado')
  })

  it('ignora respuestas de llamadas que no van al backend (otro origen)', async () => {
    await instalar()
    mockRespuesta(401)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=x')

    const eventos = dispatchSpy.mock.calls.map(c => (c[0] as Event).type)
    expect(eventos).not.toContain('google-session-expired')
  })

  it('instalar el interceptor dos veces no envuelve fetch dos veces', async () => {
    const mod = await import('./interceptorSesion')
    mod.instalarInterceptorSesion()
    const fetchTrasPrimera = window.fetch

    mod.instalarInterceptorSesion()
    const fetchTrasSegunda = window.fetch

    expect(fetchTrasSegunda).toBe(fetchTrasPrimera)
  })
})
