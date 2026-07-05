import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMetricas } from './useMetricas'
import { obtenerMetricas } from '../services/estadisticos_service'
import type { Metricas } from '../services/estadisticos_service'
import type { FiltrosMetricas } from '../services/estadisticos_service'

vi.mock('../services/estadisticos_service', () => ({
  obtenerMetricas: vi.fn(),
}))

const metricasFalsas = {
  total_esperados: 100,
  total_encuestados: 45,
  tasa_respuesta_porcentaje: 45,
  promedio_satisfaccion_general: 6.2,
  escala_maxima_satisfaccion: 7,
  escala_maxima_likert: 4,
} as unknown as Metricas

describe('useMetricas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no llama al service si idProceso es null', () => {
    renderHook(() => useMetricas(null, { tipo: 'estudiantes' }))
    expect(obtenerMetricas).not.toHaveBeenCalled()
  })

  it('carga métricas cuando hay idProceso', async () => {
    vi.mocked(obtenerMetricas).mockResolvedValue(metricasFalsas)

    const { result } = renderHook(({ filtros }: { filtros: FiltrosMetricas }) => useMetricas('proceso-1', filtros),    { initialProps: { filtros: { tipo: 'estudiantes' } as FiltrosMetricas } }
   )

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))

    expect(result.current.metricas).toEqual(metricasFalsas)
    expect(result.current.error).toBeNull()
  })

  it('setea error si el service falla', async () => {
    vi.mocked(obtenerMetricas).mockRejectedValue(new Error('falló la red'))

    const { result } = renderHook(() => useMetricas('proceso-1', { tipo: 'estudiantes' }))

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.error).toBe('No se pudieron cargar las métricas')
    expect(result.current.metricas).toBeNull()
  })

  it('vuelve a pedir métricas cuando cambian los filtros (aunque idProceso no cambie)', async () => {
    vi.mocked(obtenerMetricas).mockResolvedValue(metricasFalsas)

    const { rerender } = renderHook(({ filtros }: { filtros: FiltrosMetricas }) => useMetricas('proceso-1', filtros),
    { initialProps: { filtros: { tipo: 'estudiantes' } as FiltrosMetricas } }
   )

    await waitFor(() => expect(obtenerMetricas).toHaveBeenCalledTimes(1))

    rerender({ filtros: { tipo: 'socios' as const } })

    await waitFor(() => expect(obtenerMetricas).toHaveBeenCalledTimes(2))
    expect(obtenerMetricas).toHaveBeenLastCalledWith('proceso-1', { tipo: 'socios' })
  })

  it('NO vuelve a pedir si el objeto de filtros es una nueva instancia pero con el mismo contenido', async () => {
    // esto es justo lo que el hook evita al usar JSON.stringify(filtros) como dependencia
    vi.mocked(obtenerMetricas).mockResolvedValue(metricasFalsas)

    const { rerender } = renderHook(
      ({ filtros }) => useMetricas('proceso-1', filtros),
      { initialProps: { filtros: { tipo: 'estudiantes' as const } } }
    )

    await waitFor(() => expect(obtenerMetricas).toHaveBeenCalledTimes(1))

    rerender({ filtros: { tipo: 'estudiantes' } }) // objeto nuevo, mismo contenido
    await new Promise(r => setTimeout(r, 0))
    expect(obtenerMetricas).toHaveBeenCalledTimes(1)
  })
})