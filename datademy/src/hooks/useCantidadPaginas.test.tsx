import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCantidadPaginas } from './useCantidadPaginas'
import { obtenerCantidadPaginas } from '../services/estadisticos_service'
import type { CantidadPaginasResponse } from '../services/estadisticos_service'

vi.mock('../services/estadisticos_service', () => ({
  obtenerCantidadPaginas: vi.fn(),
}))

const respuestaFalsa: CantidadPaginasResponse = {
  estado: 'ok',
  cantidad_paginas_total: 6,
  cantidad_constructos: 4,
}

describe('useCantidadPaginas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no llama al service si idProceso es null', () => {
    const { result } = renderHook(() => useCantidadPaginas(null, 'estudiantes'))

    expect(obtenerCantidadPaginas).not.toHaveBeenCalled()
    expect(result.current.datosPaginas).toBeNull()
    expect(result.current.cargandoPaginas).toBe(false)
  })

  it('carga los datos de páginas cuando hay idProceso', async () => {
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(respuestaFalsa)

    const { result } = renderHook(() => useCantidadPaginas('proceso-1', 'estudiantes'))

    expect(result.current.cargandoPaginas).toBe(true)
    await waitFor(() => expect(result.current.cargandoPaginas).toBe(false))

    expect(result.current.datosPaginas).toEqual(respuestaFalsa)
    expect(obtenerCantidadPaginas).toHaveBeenCalledWith('proceso-1', 'estudiantes')
  })

  it('deja datosPaginas en null si el service falla, sin dejar cargandoPaginas colgado', async () => {
    vi.mocked(obtenerCantidadPaginas).mockRejectedValue(new Error('error de red'))

    const { result } = renderHook(() => useCantidadPaginas('proceso-1', 'socios'))

    await waitFor(() => expect(result.current.cargandoPaginas).toBe(false))
    expect(result.current.datosPaginas).toBeNull()
  })

  it('vuelve a pedir los datos cuando cambia el idProceso', async () => {
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(respuestaFalsa)

    const { result, rerender } = renderHook(
      ({ id }) => useCantidadPaginas(id, 'estudiantes'),
      { initialProps: { id: 'proceso-1' } }
    )
    await waitFor(() => expect(result.current.cargandoPaginas).toBe(false))
    expect(obtenerCantidadPaginas).toHaveBeenCalledTimes(1)

    rerender({ id: 'proceso-2' })

    await waitFor(() => expect(obtenerCantidadPaginas).toHaveBeenCalledTimes(2))
    expect(obtenerCantidadPaginas).toHaveBeenLastCalledWith('proceso-2', 'estudiantes')
  })

  it('vuelve a pedir los datos cuando cambia el tipo aunque el idProceso sea el mismo', async () => {
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(respuestaFalsa)

    const { rerender } = renderHook(
      ({ tipo }: { tipo: 'estudiantes' | 'socios' }) => useCantidadPaginas('proceso-1', tipo),
      { initialProps: { tipo: 'estudiantes' as 'estudiantes' | 'socios' } }
    )
    await waitFor(() => expect(obtenerCantidadPaginas).toHaveBeenCalledTimes(1))

    rerender({ tipo: 'socios' })

    await waitFor(() => expect(obtenerCantidadPaginas).toHaveBeenCalledTimes(2))
    expect(obtenerCantidadPaginas).toHaveBeenLastCalledWith('proceso-1', 'socios')
  })
})
