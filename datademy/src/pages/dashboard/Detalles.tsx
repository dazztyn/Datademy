import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import ThemeToggle from '../../components/ThemeToggle'
import { temasPagina, temaDefault } from '../../utils/temasPagina'
import { useTheme } from '../../context/ThemeContext'

export default function Detalles() {
  const location = useLocation()

const titulos: Record<string, string> = {
  '/detalles': 'Inicio',
  '/detalles/alumnos': 'Lista de alumnos',
  '/detalles/socios': 'Lista de socios',
  '/detalles/graficos': 'Gráficos generales',
  '/detalles/cronbach': 'Cronbach',
  '/detalles/informe': 'Generar informe',
  '/detalles/completar': 'Completar datos',
}
  const tema = temasPagina[location.pathname] ?? temaDefault
  const titulo = titulos[location.pathname] ?? 'Detalles'
  const { theme } = useTheme()
  return (
    <div
  className="flex min-h-screen transition-all duration-500"
  style={theme === 'light'
    ? { background: `linear-gradient(135deg, ${tema.fondoDesde}, ${tema.fondoHasta})` }
    : { background: `linear-gradient(135deg, #0f172a, ${tema.sidebar})` }
  }
>
      <Sidebar />
      <main className="flex-1 p-8"> 
          <h1
            className="text-2xl font-semibold drop-shadow mb-6"
            style={{ color: theme === 'dark' ? 'white' : tema.sidebar }}
          >
            {titulo}
          </h1>
        <Outlet />
      </main>

      <ThemeToggle />
    </div>
  )
}