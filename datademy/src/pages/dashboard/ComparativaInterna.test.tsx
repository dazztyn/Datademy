import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ComparativaInterna from './ComparativaInterna'
import { useProceso } from '../../context/ProcesoContext'
import { useTheme } from '../../context/ThemeContext'
import { useFiltrosDisponibles } from '../../hooks/useFiltrosDisponibles'
import { obtenerComparativaInterna } from '../../services/estadisticos_service'
import type { ComparativaResponse } from '../../services/estadisticos_service'

vi.mock('../../context/ProcesoContext')
vi.mock('../../context/ThemeContext')
vi.mock('../../hooks/useFiltrosDisponibles')
vi.mock('../../services/estadisticos_service', async () => {
  const real = await vi.importActual('../../services/estadisticos_service')
  return { ...real, obtenerComparativaInterna: vi.fn() }
})

const filtrosDisponiblesFalsos = {
  carreras: ['Enfermería', 'Psicología'],
  sedes: ['Coquimbo', 'La Serena'],
  asignaturas: ['Anatomía'],
  niveles_formativos: ['Pregrado'],
  generos: ['Femenino', 'Masculino'],
}

function mockearContextoBase() {
  vi.mocked(useProceso).mockReturnValue({ idProceso: 'proceso-1' } as any)
  vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() } as any)
  vi.mocked(useFiltrosDisponibles).mockReturnValue({
    filtros: filtrosDisponiblesFalsos,
    cargando: false,
  } as any)
}

function renderComparativa() {
  return render(
    <MemoryRouter>
      <ComparativaInterna />
    </MemoryRouter>
  )
}

const respuestaComparativaFalsa: ComparativaResponse = {
  estado: 'ok',
  cantidad_procesos_comparados: 1,
  comparativa_global: [
    {
      id_proceso: 'proceso-1',
      nombre_proceso: 'Enfermería 2026',
      anio: 2026,
      metricas: {
        total_esperados: 100,
        total_encuestados: 50,
        tasa_respuesta_porcentaje: 50,
        promedios_por_pagina: [],
        promedio_satisfaccion_general: 6.0,
        escala_maxima_likert: 7,
        nps_satisfaccion: {
          score_nps: 20,
          distribucion_porcentajes: { promotores_pct: 40, pasivos_pct: 40, detractores_pct: 20 },
          cantidades_reales: { promotores: 20, pasivos: 20, detractores: 10, total: 50 },
        },
      },
      variacion_satisfaccion_respecto_anterior: null,
      variaciones_constructos: [],
    },
  ],
  comparativa_alfas: [],
  comparativa_promedios: [],
}

describe('ComparativaInterna', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra "No hay proceso seleccionado" si no hay idProceso', () => {
    vi.mocked(useProceso).mockReturnValue({ idProceso: null } as any)
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() } as any)
    vi.mocked(useFiltrosDisponibles).mockReturnValue({ filtros: {}, cargando: false } as any)

    renderComparativa()

    expect(screen.getByText('No hay proceso seleccionado.')).toBeInTheDocument()
  })

  it('deshabilita el filtro que coincide con la agrupación actual ("carrera" por defecto)', () => {
    mockearContextoBase()
    renderComparativa()

    expect(screen.getByDisplayValue('Carrera: todos')).toBeDisabled()
    expect(screen.getByDisplayValue('Sede: todos')).not.toBeDisabled()
    expect(screen.getByDisplayValue('Asignatura: todos')).not.toBeDisabled()
    expect(screen.getByDisplayValue('Nivel formativo: todos')).not.toBeDisabled()
  })

  it('al cambiar la agrupación, deshabilita el nuevo filtro y habilita el anterior', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    renderComparativa()

    await user.selectOptions(screen.getByDisplayValue('Carrera'), 'sede')

    expect(screen.getByDisplayValue('Sede: todos')).toBeDisabled()
    expect(screen.getByDisplayValue('Carrera: todos')).not.toBeDisabled()
  })

  it('REGRESIÓN: cambiar de agrupación limpia la selección de valores previa', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    renderComparativa()

    await user.click(screen.getByRole('checkbox', { name: 'Enfermería' }))
    expect(screen.getByText('1 seleccionado')).toBeInTheDocument()

    await user.selectOptions(screen.getByDisplayValue('Carrera'), 'sede')

    expect(screen.getByText('0 seleccionados')).toBeInTheDocument()
  })

  it('REGRESIÓN: cambiar de agrupación limpia el valor cargado en el filtro que dejó de aplicar', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    renderComparativa()

    // filtro "sede" sí aplica mientras agrupamos por carrera
    await user.selectOptions(screen.getByDisplayValue('Sede: todos'), 'Coquimbo')
    expect(screen.getByDisplayValue('Coquimbo')).toBeInTheDocument()

    // ahora agrupamos por sede: ese filtro deja de aplicar y su valor debe limpiarse
    await user.selectOptions(screen.getByDisplayValue('Carrera'), 'sede')

    expect(screen.getByDisplayValue('Sede: todos')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Coquimbo')).not.toBeInTheDocument()
  })

  it('el botón "Comparar" permanece deshabilitado mientras no haya nada seleccionado', () => {
    mockearContextoBase()
    renderComparativa()

    expect(screen.getByText('Comparar').closest('button')).toBeDisabled()
  })

  it('se habilita "Comparar" al seleccionar al menos un valor, y llama al service con los filtros correctos', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    vi.mocked(obtenerComparativaInterna).mockResolvedValue(respuestaComparativaFalsa)
    renderComparativa()

    await user.selectOptions(screen.getByDisplayValue('Sede: todos'), 'Coquimbo')
    await user.click(screen.getByRole('checkbox', { name: 'Enfermería' }))

    const boton = screen.getByText('Comparar').closest('button')!
    expect(boton).not.toBeDisabled()

    await user.click(boton)

    expect(obtenerComparativaInterna).toHaveBeenCalledWith(
      'proceso-1',
      'carrera',
      ['Enfermería'],
      expect.objectContaining({ sede: 'Coquimbo' })
    )
  })

  it('REGRESIÓN: nunca envía como filtro la misma clave por la que se está agrupando', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    vi.mocked(obtenerComparativaInterna).mockResolvedValue(respuestaComparativaFalsa)
    renderComparativa()

    await user.click(screen.getByRole('checkbox', { name: 'Enfermería' }))
    await user.click(screen.getByText('Comparar'))

    await waitFor(() => expect(obtenerComparativaInterna).toHaveBeenCalled())
    const filtrosEnviados = vi.mocked(obtenerComparativaInterna).mock.calls[0][3]
    expect(filtrosEnviados?.carrera).toBeUndefined()
  })

  it('marca y desmarca valores al hacer click repetido (toggle)', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    renderComparativa()

    const checkbox = screen.getByRole('checkbox', { name: 'Enfermería' })
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(screen.getByText('1 seleccionado')).toBeInTheDocument()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText('0 seleccionados')).toBeInTheDocument()
  })

  it('muestra un mensaje de error si el service falla al comparar', async () => {
    const user = userEvent.setup()
    mockearContextoBase()
    vi.mocked(obtenerComparativaInterna).mockRejectedValue(new Error('falló'))
    renderComparativa()

    await user.click(screen.getByRole('checkbox', { name: 'Enfermería' }))
    await user.click(screen.getByText('Comparar'))

    await waitFor(() => {
      expect(screen.getByText('No se pudo obtener la comparativa')).toBeInTheDocument()
    })
  })

  it('muestra "Cargando opciones..." mientras useFiltrosDisponibles está cargando', () => {
    vi.mocked(useProceso).mockReturnValue({ idProceso: 'proceso-1' } as any)
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() } as any)
    vi.mocked(useFiltrosDisponibles).mockReturnValue({ filtros: {}, cargando: true } as any)

    renderComparativa()

    expect(screen.getByText('Cargando opciones...')).toBeInTheDocument()
  })
})
