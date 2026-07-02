import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import ThemeToggle from '../../components/ThemeToggle'
import { temasPagina, temaDefault } from '../../utils/temasPagina'
import { useTheme } from '../../context/ThemeContext'
import { useProceso } from '../../context/ProcesoContext'
import { useEffect, useState } from 'react'
import { sincronizarManual } from '../../services/estadisticos_service'

export default function Detalles() {
  const location = useLocation()
  const { theme } = useTheme()
  const { idProceso, verificarMetadatos } = useProceso()
  const [sincronizando, setSincronizando] = useState(false)
  const handleSincronizado = () => {
    if (idProceso) verificarMetadatos(idProceso)
  }
const handleSincronizar = async () => {
    if (!idProceso || sincronizando) return
    setSincronizando(true)
    try {
      await sincronizarManual(idProceso)
      handleSincronizado()
    } catch (err) {
      console.error('Error al sincronizar', err)
    } finally {
      setSincronizando(false)
    }
  }
  useEffect(() => {
    if (!idProceso) return
    handleSincronizar()
  }, [idProceso])

  const titulos: Record<string, string> = {
    '/detalles': 'Inicio',
    '/detalles/listado': 'Lista de respuestas',
    '/detalles/graficos': 'Gráficos generales',
    '/detalles/cronbach': 'Cronbach',
    '/detalles/informe': 'Generar informe',
    '/detalles/completar': 'Completar datos',
    '/detalles/listar-informes': 'Informes creados',
  }
  const tema = temasPagina[location.pathname] ?? temaDefault
  const titulo = titulos[location.pathname] ?? 'Detalles'
  return (
    <div
      className="flex min-h-screen transition-all duration-500"
      style={
        theme === 'light'
          ? { background: `linear-gradient(135deg, ${tema.fondoDesde}, ${tema.fondoHasta})` }
          : { background: `linear-gradient(135deg, #0f172a, ${tema.sidebar})` }
      }
    >
      <Sidebar sync={sincronizando} onSincronizar={handleSincronizar} />
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
