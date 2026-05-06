import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import ThemeToggle from '../../components/ThemeToggle'
import { temasPagina, temaDefault } from '../../utils/temasPagina'

export default function Detalles() {
  const location = useLocation()

  const titulos: Record<string, string> = {
    '/detalles': 'Inicio',
    '/detalles/formularios': 'Formularios',
    '/detalles/visualizar': 'Visualizar datos',
    '/detalles/informe': 'Generar informe',
  }

  const tema = temasPagina[location.pathname] ?? temaDefault
  const titulo = titulos[location.pathname] ?? 'Detalles'

  return (
    <div
      className="flex min-h-screen transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${tema.fondoDesde}, ${tema.fondoHasta})`,
      }}
    >
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-white drop-shadow mb-6">
          {titulo}
        </h1>
        <Outlet />
      </main>

      <ThemeToggle />
    </div>
  )
}