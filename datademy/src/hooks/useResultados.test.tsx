import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useResultados } from './useResultados'
import { obtenerResultados } from '../services/estadisticos_service'
import type { ResultadosResponse, FiltrosResultados } from '../services/estadisticos_service'

vi.mock('../services/estadisticos_service', () => ({
  obtenerResultados: vi.fn(),
}))

const respuestaFalsa: ResultadosResponse = {
  estado: 'ok',
  total_respuestas: 3,
  datos: [],
}

describe('useResultados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no llama al service si idProceso es null', () => {
    const { result } = renderHook(() => useResultados(null, {}))

    expect(obtenerResultados).not.toHaveBeenCalled()
    expect(result.current.resultados).toBeNull()
    expect(result.current.cargando).toBe(false)
  })

  it('carga los resultados cuando hay idProceso', async () => {
    vi.mocked(obtenerResultados).mockResolvedValue(respuestaFalsa)

    const { result } = renderHook(() => useResultados('proceso-1', { tipo: 'estudiantes' }))

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))

    expect(result.current.resultados).toEqual(respuestaFalsa)
    expect(result.current.error).toBeNull()
    expect(obtenerResultados).toHaveBeenCalledWith('proceso-1', { tipo: 'estudiantes' })
  })

  it('setea error si el service falla', async () => {
    vi.mocked(obtenerResultados).mockRejectedValue(new Error('falló la red'))

    const { result } = renderHook(() => useResultados('proceso-1', {}))

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.error).toBe('No se pudieron cargar los resultados')
    expect(result.current.resultados).toBeNull()
  })

  it('limpia el error anterior al volver a pedir resultados', async () => {
    vi.mocked(obtenerResultados).mockRejectedValueOnce(new Error('falló'))

    const { result, rerender } = renderHook(
      ({ filtros }: { filtros: FiltrosResultados }) => useResultados('proceso-1', filtros),
      { initialProps: { filtros: { tipo: 'estudiantes' } as FiltrosResultados } }
    )
    await waitFor(() => expect(result.current.error).toBe('No se pudieron cargar los resultados'))

    vi.mocked(obtenerResultados).mockResolvedValueOnce(respuestaFalsa)
    rerender({ filtros: { tipo: 'socios' } })

    // mientras la nueva petición está en curso, el error viejo ya no debería quedar visible
    expect(result.current.error).toBeNull()
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.resultados).toEqual(respuestaFalsa)
  })

  it('vuelve a pedir resultados cuando cambian los filtros (aunque idProceso no cambie)', async () => {
    vi.mocked(obtenerResultados).mockResolvedValue(respuestaFalsa)

    const { rerender } = renderHook(
      ({ filtros }: { filtros: FiltrosResultados }) => useResultados('proceso-1', filtros),
      { initialProps: { filtros: { tipo: 'estudiantes' } as FiltrosResultados } }
    )
    await waitFor(() => expect(obtenerResultados).toHaveBeenCalledTimes(1))

    rerender({ filtros: { tipo: 'socios' } })

    await waitFor(() => expect(obtenerResultados).toHaveBeenCalledTimes(2))
    expect(obtenerResultados).toHaveBeenLastCalledWith('proceso-1', { tipo: 'socios' })
  })

  it('NO vuelve a pedir si el objeto de filtros es una nueva instancia pero con el mismo contenido', async () => {
    vi.mocked(obtenerResultados).mockResolvedValue(respuestaFalsa)

    const { rerender } = renderHook(
      ({ filtros }: { filtros: FiltrosResultados }) => useResultados('proceso-1', filtros),
      { initialProps: { filtros: { tipo: 'estudiantes' } as FiltrosResultados } }
    )
    await waitFor(() => expect(obtenerResultados).toHaveBeenCalledTimes(1))

    rerender({ filtros: { tipo: 'estudiantes' } }) 
    await new Promise(r => setTimeout(r, 0))
    expect(obtenerResultados).toHaveBeenCalledTimes(1)
  })
})
