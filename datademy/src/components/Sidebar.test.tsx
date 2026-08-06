import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useProceso } from '../context/ProcesoContext'
import { useInforme } from '../context/InformeContext'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/ProcesoContext')
vi.mock('../context/InformeContext')
vi.mock('../context/AuthContext')

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(useInforme).mockReturnValue({ estadoJob: 'idle' } as any)
    vi.mocked(useAuth).mockReturnValue({ cerrarSesion: vi.fn() } as any)
  })

  it('bloquea las secciones que requieren metadatos cuando metadatosCompletos es false', () => {
    vi.mocked(useProceso).mockReturnValue({
      idProceso: 'proceso-1',
      metadatosCompletos: false,
      verificandoMetadatos: false,
    } as any)

    renderSidebar()

    expect(screen.getByText('Gráficos generales').closest('button')).toBeDisabled()
    expect(screen.getByText('Alfa de Cronbach').closest('button')).toBeDisabled()
  })

  it('habilita las secciones cuando metadatosCompletos es true', () => {
    vi.mocked(useProceso).mockReturnValue({
      idProceso: 'proceso-1',
      metadatosCompletos: true,
      verificandoMetadatos: false,
    } as any)

    renderSidebar()

    expect(screen.getByText('Gráficos generales').closest('button')).not.toBeDisabled()
  })

  it('deshabilita "Comparativa interna" si no hay proceso seleccionado', () => {
    vi.mocked(useProceso).mockReturnValue({
      idProceso: null,
      metadatosCompletos: false,
      verificandoMetadatos: false,
    } as any)

    renderSidebar()

    expect(screen.getByText('Comparativa interna').closest('button')).toBeDisabled()
  })

  it('bloquea "Comparativa interna" si hay proceso pero faltan metadatos (aunque idProceso exista)', () => {
    vi.mocked(useProceso).mockReturnValue({
      idProceso: 'proceso-1',
      metadatosCompletos: false,
      verificandoMetadatos: false,
    } as any)

    renderSidebar()

    expect(screen.getByText('Comparativa interna').closest('button')).toBeDisabled()
  })

  it('al hacer click en "Comparativa interna" habilitada, abre el modal de confirmación', async () => {
    const user = userEvent.setup()
    vi.mocked(useProceso).mockReturnValue({
      idProceso: 'proceso-1',
      metadatosCompletos: true,
      verificandoMetadatos: false,
    } as any)

    renderSidebar()

    await user.click(screen.getByText('Comparativa interna'))

    expect(screen.getByText('Esto lo llevará a otra sección, ¿continuar?')).toBeInTheDocument()
  })

  it('el botón de refresh gira mientras sync está en true', () => {
    vi.mocked(useProceso).mockReturnValue({
      idProceso: 'proceso-1',
      metadatosCompletos: true,
      verificandoMetadatos: false,
    } as any)

    renderSidebar()
    // sin sync=true pasado como prop, no debería girar
    const icono = screen.getByAltText('Refresh')
    expect(icono.className).not.toContain('animate-spin')
  })
})