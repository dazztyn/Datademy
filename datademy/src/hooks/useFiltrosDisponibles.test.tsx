import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFiltrosDisponibles } from './useFiltrosDisponibles'
import { obtenerFiltrosDisponibles } from '../services/estadisticos_service'

vi.mock('../services/estadisticos_service', () => ({
  obtenerFiltrosDisponibles: vi.fn(),
}))

describe('useFiltrosDisponibles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('empieza con filtros vacíos y cargando en false hasta que hay idProceso', () => {
    const { result } = renderHook(() => useFiltrosDisponibles(null, 'estudiantes'))
    expect(result.current.filtros).toEqual({})
    expect(result.current.cargando).toBe(false)
    expect(obtenerFiltrosDisponibles).not.toHaveBeenCalled()
  })

  it('carga los filtros disponibles cuando hay idProceso', async () => {
    vi.mocked(obtenerFiltrosDisponibles).mockResolvedValue({
      carreras: ['Enfermería', 'Psicología'],
      sedes: ['Coquimbo'],
    })

    const { result } = renderHook(() => useFiltrosDisponibles('proceso-1', 'estudiantes'))

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.filtros.carreras).toEqual(['Enfermería', 'Psicología'])
  })

  it('resetea los filtros a {} apenas cambia idProceso, antes de que llegue la respuesta nueva', async () => {
    vi.mocked(obtenerFiltrosDisponibles).mockResolvedValue({ carreras: ['Enfermería'] })

    const { result, rerender } = renderHook(
      ({ id }) => useFiltrosDisponibles(id, 'estudiantes'),
      { initialProps: { id: 'proceso-1' } }
    )
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.filtros.carreras).toEqual(['Enfermería'])

    // proceso nuevo, respuesta todavía no resuelve
    let resolver: (v: any) => void = () => {}
    vi.mocked(obtenerFiltrosDisponibles).mockReturnValue(new Promise(r => { resolver = r }))

    rerender({ id: 'proceso-2' })

    // mientras la nueva promesa no resuelve, no debe seguir mostrando datos del proceso-1
    expect(result.current.filtros).toEqual({})

    resolver({ carreras: ['Psicología'] })
    await waitFor(() => expect(result.current.filtros.carreras).toEqual(['Psicología']))
  })

  it('cae a filtros vacíos si el service falla, sin dejar la app colgada en "cargando"', async () => {
    vi.mocked(obtenerFiltrosDisponibles).mockRejectedValue(new Error('error de red'))

    const { result } = renderHook(() => useFiltrosDisponibles('proceso-1', 'estudiantes'))

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.filtros).toEqual({})
  })
})