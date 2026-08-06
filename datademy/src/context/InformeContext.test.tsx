import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { InformeProvider, useInforme } from './InformeContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return <InformeProvider>{children}</InformeProvider>
}

function respuestaFetch(body: object, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response)
}

describe('InformeContext — polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('pasa a "completado" y guarda la url cuando el back responde estado: completado', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      await respuestaFetch({ estado: 'completado', resultado: { url_informe: 'https://drive.google.com/x' } })
    )

    const { result } = renderHook(() => useInforme(), { wrapper })

    act(() => result.current.escucharEstadoJob('job-1'))
    expect(result.current.estadoJob).toBe('procesando')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000) // primer tick del setInterval
    })

    expect(result.current.estadoJob).toBe('completado')
    expect(result.current.urlInforme).toBe('https://drive.google.com/x')
  })

  it('pasa a "error" cuando el back responde estado: error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await respuestaFetch({ estado: 'error' }))

    const { result } = renderHook(() => useInforme(), { wrapper })
    act(() => result.current.escucharEstadoJob('job-1'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(result.current.estadoJob).toBe('error')
  })

  it('pasa a "error" si el fetch del polling falla (red caída, response no-ok)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await respuestaFetch({}, false))

    const { result } = renderHook(() => useInforme(), { wrapper })
    act(() => result.current.escucharEstadoJob('job-1'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(result.current.estadoJob).toBe('error')
  })

  it('pasa a "error" por timeout si el job sigue "procesando" pasados los 2 minutos', async () => {
    // cada tick del polling responde "procesando" — nunca resuelve por sí solo
    vi.mocked(fetch).mockResolvedValue(await respuestaFetch({ estado: 'procesando' }))

    const { result } = renderHook(() => useInforme(), { wrapper })
    act(() => result.current.escucharEstadoJob('job-1'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000) // exactamente MAX_POLLING_MS
    })

    expect(result.current.estadoJob).toBe('error')
  })

  it('REGRESIÓN: no vuelve a marcar error por timeout si ya se completó antes de los 2 minutos', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      await respuestaFetch({ estado: 'completado', resultado: { url_informe: 'https://drive.google.com/x' } })
    )

    const { result } = renderHook(() => useInforme(), { wrapper })
    act(() => result.current.escucharEstadoJob('job-1'))

    // se completa rápido, mucho antes del timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(result.current.estadoJob).toBe('completado')

    // avanzamos el reloj hasta pasar el timeout de 2 minutos igual
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000)
    })

    // sin el fix de intervaloRef.current = null, esto se convertía en 'error'
    expect(result.current.estadoJob).toBe('completado')
    expect(result.current.urlInforme).toBe('https://drive.google.com/x')
  })

  it('detiene los ticks del polling una vez que llega a un estado final', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await respuestaFetch({ estado: 'completado', resultado: { url_informe: 'x' } }))

    const { result } = renderHook(() => useInforme(), { wrapper })
    act(() => result.current.escucharEstadoJob('job-1'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(fetch).toHaveBeenCalledTimes(1)

    // si el interval no se hubiera limpiado, esto dispararía más llamadas a fetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000) // 3 ticks más, si siguiera vivo
    })
    expect(fetch).toHaveBeenCalledTimes(1) 
  })

  it('resetear() vuelve todo a idle', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await respuestaFetch({ estado: 'completado', resultado: { url_informe: 'x' } }))

    const { result } = renderHook(() => useInforme(), { wrapper })
    act(() => result.current.escucharEstadoJob('job-1'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    act(() => result.current.resetear())

    expect(result.current.estadoJob).toBe('idle')
    expect(result.current.urlInforme).toBeNull()
  })
})