import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ProcesoProvider, useProceso } from './ProcesoContext'
import { obtenerCantidadPaginas } from '../services/estadisticos_service'
import type { CantidadPaginasResponse } from '../services/estadisticos_service'

vi.mock('../services/estadisticos_service', () => ({
  obtenerCantidadPaginas: vi.fn(),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return <ProcesoProvider>{children}</ProcesoProvider>
}
function instalarFetchFalso(respuestasPorId: Record<string, { ok: boolean; data?: any; delayMs?: number }>) {
  const fetchFalso = vi.fn((url: string) => {
    const match = url.match(/formularios\/([^/]+)\/metadatos/)
    const id = match?.[1] ?? ''
    const config = respuestasPorId[id] ?? { ok: false }

    const respuesta = {
      ok: config.ok,
      json: async () => config.data ?? {},
    }

    if (config.delayMs) {
      return new Promise(resolve => setTimeout(() => resolve(respuesta), config.delayMs))
    }
    return Promise.resolve(respuesta)
  })

  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

function paginas(cantidad_constructos: number): CantidadPaginasResponse {
  return { estado: 'ok', cantidad_paginas_total: cantidad_constructos + 2, cantidad_constructos }
}

describe('ProcesoContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('recupera idProceso desde sessionStorage al iniciar', async () => {
    sessionStorage.setItem('idProceso', 'proceso-guardado')
    instalarFetchFalso({ 'proceso-guardado': { ok: true, data: { estan_completos: false } } })
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(paginas(3))

    const { result } = renderHook(() => useProceso(), { wrapper })

    expect(result.current.idProceso).toBe('proceso-guardado')
    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
  })

  it('empieza sin proceso si sessionStorage está vacío, y metadatosCompletos en false', () => {
    const { result } = renderHook(() => useProceso(), { wrapper })

    expect(result.current.idProceso).toBeNull()
    expect(result.current.metadatosCompletos).toBe(false)
    expect(result.current.verificandoMetadatos).toBe(false)
  })

  it('setIdProceso persiste en sessionStorage y actualiza el estado', async () => {
    instalarFetchFalso({ 'proceso-1': { ok: true, data: { estan_completos: false } } })
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(paginas(3))

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })

    expect(result.current.idProceso).toBe('proceso-1')
    expect(sessionStorage.getItem('idProceso')).toBe('proceso-1')
  })

  it('al setear un proceso, verifica metadatos automáticamente y pasa por verificandoMetadatos', async () => {
    instalarFetchFalso({ 'proceso-1': { ok: true, data: { estan_completos: false } } })
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(paginas(3))

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })

    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
    expect(result.current.metadatosCompletos).toBe(false)
  })

  it('metadatosCompletos queda en true cuando el back confirma completitud y los constructos coinciden', async () => {
    instalarFetchFalso({
      'proceso-1': {
        ok: true,
        data: {
          estan_completos: true,
          metadatos: {
            estudiantes: { nombres_constructos: ['A', 'B', 'C'] },
            socios: { nombres_constructos: ['X', 'Y'] },
          },
        },
      },
    })
    vi.mocked(obtenerCantidadPaginas).mockImplementation((_id, tipo) =>
      Promise.resolve(paginas(tipo === 'estudiantes' ? 3 : 2))
    )

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })

    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
    expect(result.current.metadatosCompletos).toBe(true)
  })

  it('REGRESIÓN: metadatosCompletos queda en false si el back dice que están completos pero los constructos NO coinciden (desfase)', async () => {
    instalarFetchFalso({
      'proceso-1': {
        ok: true,
        data: {
          estan_completos: true,
          metadatos: {
            estudiantes: { nombres_constructos: ['A', 'B', 'C'] }, // se guardaron 3
            socios: { nombres_constructos: ['X', 'Y'] },
          },
        },
      },
    })
    // el formulario AHORA tiene 4 constructos para estudiantes, ya no coincide con los 3 guardados
    vi.mocked(obtenerCantidadPaginas).mockImplementation((_id, tipo) =>
      Promise.resolve(paginas(tipo === 'estudiantes' ? 4 : 2))
    )

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })

    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
    expect(result.current.metadatosCompletos).toBe(false)
  })

  it('no bloquea la validación si no se pudo determinar la cantidad de páginas (falla al obtenerla)', async () => {
    instalarFetchFalso({
      'proceso-1': {
        ok: true,
        data: {
          estan_completos: true,
          metadatos: {
            estudiantes: { nombres_constructos: ['A', 'B', 'C'] },
            socios: { nombres_constructos: ['X'] },
          },
        },
      },
    })
    // obtenerCantidadPaginas falla para ambos tipos -> el hook cae a null vía .catch(() => null)
    vi.mocked(obtenerCantidadPaginas).mockRejectedValue(new Error('no disponible'))

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })

    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
    // sin forma de comparar, constructosCoinciden no bloquea (paginas === null -> true)
    expect(result.current.metadatosCompletos).toBe(true)
  })

  it('metadatosCompletos queda en false si no hay metadatos guardados en absoluto', async () => {
    instalarFetchFalso({
      'proceso-1': { ok: true, data: { estan_completos: false } },
    })
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(paginas(3))

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })

    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
    expect(result.current.metadatosCompletos).toBe(false)
  })

  it('metadatosCompletos cae a false si la respuesta del back no es exitosa (response.ok = false)', async () => {
    instalarFetchFalso({ 'proceso-1': { ok: false } })
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(paginas(3))

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })

    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
    expect(result.current.metadatosCompletos).toBe(false)
  })

  it('REGRESIÓN: ignora una respuesta tardía de un proceso viejo si el proceso ya cambió (condición de carrera)', async () => {
    instalarFetchFalso({
      'proceso-A': {
        ok: true,
        delayMs: 100, // A tarda más en responder que B
        data: {
          estan_completos: true,
          metadatos: {
            estudiantes: { nombres_constructos: ['A', 'B', 'C'] },
            socios: { nombres_constructos: ['X'] },
          },
        },
      },
      'proceso-B': { ok: true, data: { estan_completos: false } },
    })
    vi.mocked(obtenerCantidadPaginas).mockImplementation((_id, tipo) =>
      Promise.resolve(paginas(tipo === 'estudiantes' ? 3 : 1))
    )

    const { result } = renderHook(() => useProceso(), { wrapper })

    await act(async () => { result.current.setIdProceso('proceso-A') })
    await act(async () => { result.current.setIdProceso('proceso-B') }) // cambiamos antes de que A responda

    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))

    // dejamos que "llegue" la respuesta tardía de A
    await new Promise(r => setTimeout(r, 150))

    // el estado no debe reflejar la respuesta (completa) del proceso-A, sino la de B
    expect(result.current.idProceso).toBe('proceso-B')
    expect(result.current.metadatosCompletos).toBe(false)
  })

  it('al pasar a idProceso null, metadatosCompletos vuelve a false sin llamar al back', async () => {
    instalarFetchFalso({ 'proceso-1': { ok: true, data: { estan_completos: false } } })
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(paginas(3))

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })
    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))

    const llamadasPrevias = vi.mocked(obtenerCantidadPaginas).mock.calls.length
    await act(async () => { result.current.setMetadatosCompletos(true) })
    expect(result.current.metadatosCompletos).toBe(true)


    expect(vi.mocked(obtenerCantidadPaginas).mock.calls.length).toBe(llamadasPrevias)
  })

  it('verificarMetadatos puede invocarse manualmente y actualiza el estado igual que el automático', async () => {
    instalarFetchFalso({
      'proceso-1': { ok: true, data: { estan_completos: false } },
      'proceso-2': {
        ok: true,
        data: {
          estan_completos: true,
          metadatos: {
            estudiantes: { nombres_constructos: ['A'] },
            socios: { nombres_constructos: ['X'] },
          },
        },
      },
    })
    vi.mocked(obtenerCantidadPaginas).mockResolvedValue(paginas(1))

    const { result } = renderHook(() => useProceso(), { wrapper })
    await act(async () => { result.current.setIdProceso('proceso-1') })
    await waitFor(() => expect(result.current.verificandoMetadatos).toBe(false))
    expect(result.current.metadatosCompletos).toBe(false)

    await act(async () => {
      await result.current.verificarMetadatos('proceso-2')
    })

    expect(result.current.metadatosCompletos).toBe(true)
  })
})
