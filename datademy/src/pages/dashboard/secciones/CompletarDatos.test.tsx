import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../../../test/mocks/server'
import CompletarDatos from './CompletarDatos'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import { useCantidadPaginas } from '../../../hooks/useCantidadPaginas'
import { configurarMetadatos } from '../../../services/formularios_service'

vi.mock('../../../context/ProcesoContext')
vi.mock('../../../hooks/useMetricas')
vi.mock('../../../hooks/useCantidadPaginas')
vi.mock('../../../services/formularios_service')

// Por defecto, "sin respuestas todavía" (metricas null) — el caso que motivó
// usar cantidad_constructos en primer lugar.
function mockearContextoBase(idProceso = 'proceso-1') {
  vi.mocked(useProceso).mockReturnValue({
    idProceso,
    setMetadatosCompletos: vi.fn(),
  } as any)

  vi.mocked(useMetricas).mockReturnValue({
    metricas: null,
    cargando: false,
    error: null,
  } as any)
}

function mockearMetadatosEndpoint(respuesta: object) {
  server.use(
    http.get('*/formularios/:idProceso/metadatos', () => HttpResponse.json(respuesta))
  )
}

describe('CompletarDatos', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    mockearMetadatosEndpoint({ estan_completos: false })
  })

  it('REGRESIÓN: muestra los campos de constructo usando cantidad_constructos aunque no haya respuestas todavía', async () => {
    mockearContextoBase()
    vi.mocked(useCantidadPaginas).mockImplementation((_id, tipo) => ({
      datosPaginas: { cantidad_paginas_total: 6, cantidad_constructos: tipo === 'estudiantes' ? 4 : 2 },
      cargandoPaginas: false,
    }) as any)

    render(<CompletarDatos />)

    // este es justo el bug original: antes, sin metricas, nunca aparecían campos
    await waitFor(() => {
      expect(screen.getAllByText(/Constructo \d/).length).toBe(6) // 4 estudiantes + 2 socios
    })
    expect(screen.queryByText('Cargando estructura de estudiantes...')).not.toBeInTheDocument()
  })

  it('muestra "Cargando..." mientras no hay ni metricas ni cantidad de páginas', () => {
    mockearContextoBase()
    vi.mocked(useCantidadPaginas).mockReturnValue({ datosPaginas: null, cargandoPaginas: true } as any)

    render(<CompletarDatos />)

    expect(screen.getByText('Cargando estructura de estudiantes...')).toBeInTheDocument()
    expect(screen.getByText('Cargando estructura de socios...')).toBeInTheDocument()
  })

  it('muestra el banner de desfase cuando la cantidad guardada no coincide con la estructura actual', async () => {
    mockearContextoBase()
    vi.mocked(useCantidadPaginas).mockImplementation((_id) => ({
      datosPaginas: { cantidad_paginas_total: 6, cantidad_constructos: 4 }, // el form AHORA tiene 4
      cargandoPaginas: false,
    }) as any)
    mockearMetadatosEndpoint({
      estan_completos: true,
      metadatos: {
        estudiantes: { total_esperados: 40, nombres_constructos: ['A', 'B', 'C'] }, // se guardaron 3
      },
    })

    render(<CompletarDatos />)

    await waitFor(() => {
      expect(screen.getByText('Los datos guardados podrían estar desactualizados')).toBeInTheDocument()
    })
    expect(screen.getByText(/no coincide con la estructura actual del formulario/)).toBeInTheDocument()
  })

  it('NO muestra el banner de desfase cuando la cantidad guardada coincide', async () => {
    mockearContextoBase()
    vi.mocked(useCantidadPaginas).mockImplementation(() => ({
      datosPaginas: { cantidad_paginas_total: 6, cantidad_constructos: 3 },
      cargandoPaginas: false,
    }) as any)
    mockearMetadatosEndpoint({
      estan_completos: true,
      metadatos: {
        estudiantes: { total_esperados: 40, nombres_constructos: ['A', 'B', 'C'] },
      },
    })

    render(<CompletarDatos />)

    await waitFor(() => screen.getAllByText(/Constructo \d/))
    expect(screen.queryByText('Los datos guardados podrían estar desactualizados')).not.toBeInTheDocument()
  })

  it('el botón "Guardar todo" permanece deshabilitado mientras no se conoce la estructura del formulario', () => {
    mockearContextoBase()
    vi.mocked(useCantidadPaginas).mockReturnValue({ datosPaginas: null, cargandoPaginas: true } as any)

    render(<CompletarDatos />)

    expect(screen.getByText('Guardar todo').closest('button')).toBeDisabled()
  })

  it('valida el total de estudiantes antes de llamar a configurarMetadatos', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    vi.mocked(useCantidadPaginas).mockReturnValue({
      datosPaginas: { cantidad_paginas_total: 4, cantidad_constructos: 2 },
      cargandoPaginas: false,
    } as any)

    render(<CompletarDatos />)
    await waitFor(() => screen.getAllByText(/Constructo \d/))

    await user.click(screen.getByText('Guardar todo'))

    expect(screen.getByText('Ingresa un número válido de estudiantes esperados')).toBeInTheDocument()
    expect(configurarMetadatos).not.toHaveBeenCalled()
  })

  it('REGRESIÓN: ignora una respuesta de metadatos tardía si el proceso ya cambió (condición de carrera)', async () => {
    let idProcesoActual = 'proceso-A'
    vi.mocked(useProceso).mockImplementation(() => ({
      idProceso: idProcesoActual,
      setMetadatosCompletos: vi.fn(),
    } as any))
    vi.mocked(useMetricas).mockReturnValue({ metricas: null, cargando: false, error: null } as any)
    vi.mocked(useCantidadPaginas).mockReturnValue({
      datosPaginas: { cantidad_paginas_total: 4, cantidad_constructos: 2 },
      cargandoPaginas: false,
    } as any)

    server.use(
      http.get('*/formularios/:idProceso/metadatos', async ({ params }) => {
        if (params.idProceso === 'proceso-A') {
          await delay(100) // A tarda más en responder que B
          return HttpResponse.json({
            estan_completos: true,
            metadatos: { estudiantes: { total_esperados: 999, nombres_constructos: ['De A'] } },
          })
        }
        return HttpResponse.json({ estan_completos: false })
      })
    )

    const { rerender } = render(<CompletarDatos />)

    idProcesoActual = 'proceso-B'
    rerender(<CompletarDatos />)

    await new Promise(r => setTimeout(r, 150)) // dejamos que "llegue" la respuesta tardía de A

    const input = screen.getByPlaceholderText('Ej: 45') as HTMLInputElement
    expect(input.value).not.toBe('999')
  })
})