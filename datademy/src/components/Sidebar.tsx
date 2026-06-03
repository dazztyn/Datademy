import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { temasPagina, temaDefault } from '../utils/temasPagina'
import { useProceso } from '../context/ProcesoContext'
import { sincronizarManual } from '../services/estadisticos_service'

interface SidebarItem {
  icono: string
  titulo: string
  ruta: string
}

const items: SidebarItem[] = [
  { icono: '/src/assets/LIST.png', titulo: 'Listar resultados', ruta: '/detalles/listado' },
  { icono: '/src/assets/DATA.png', titulo: 'Gráficos generales', ruta: '/detalles/graficos' },
  { icono: '/src/assets/ALPHA.png', titulo: 'Alfa de Cronbach', ruta: '/detalles/cronbach' },
]
export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const [sync, setSync] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { idProceso } = useProceso()

  const temaBarra = temasPagina[location.pathname] ?? temaDefault

  const referesh = async () => {
    if (!idProceso || sync) return
    setSync(true)
    try {
      await sincronizarManual(idProceso)
    } catch (err) {
      console.error("Error al sincronizar", err)
    } finally {
      setSync(false)
      window.location.reload()
    }
  }

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="h-screen sticky top-0 flex flex-col py-4 transition-all duration-300 ease-in-out z-40 shadow-lg"
      style={{
        backgroundColor: temaBarra.sidebar,
        width: open ? '13rem' : '4rem',
      }}
    >
      <div className="px-3 mb-2">
        <button
          onClick={referesh}
          title="Sincronizar datos"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-all ${sync ? 'animate-spin' : ''}`}
        >
          <img
            src="/src/assets/REFRESH.png"
            alt="Refresh"
            className="w-5 h-5 object-contain flex-shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span className={`text-xs text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Sincronizar
          </span>
        </button>
      </div>
      <div className="px-3 mb-4">
        <button
          onClick={() => navigate('/detalles/completar')}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 transition-colors"
        >
          <span className={`text-xs font-medium text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Completar datos
          </span>
        </button>
      </div>
      <div className="mx-3 mb-3 border-t border-white/20" />
      <div className="flex flex-col gap-1 px-2 flex-1">
        {items.map(item => {
          const activo = location.pathname === item.ruta
          return (
            <button
              key={item.ruta}
              onClick={() => navigate(item.ruta)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left
                ${activo ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <img
                src={item.icono}
                alt={item.titulo}
                className="w-6 h-6 flex-shrink-0 object-contain"
                style={{ filter: ' brightness(0) invert(1)' }}
              />
              <span className={`text-sm font-medium text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
                {item.titulo}
              </span>
            </button>
          )
        })}
      </div>

      <div className="px-3 flex flex-col gap-2 mt-4">
        <button
          onClick={() => navigate('/detalles/informe')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:opacity-90 transition-opacity overflow-hidden"
        >
          <span
            className={`duration-300  transition-all text-xs font-semibold whitespace-nowrap overflow-hidden  ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}
            style={{ color: temaBarra.sidebar }}
          >
            Generar informe
          </span>
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <span className="text-white text-base flex-shrink-0">←</span>
          <span className={`transition-all duration-300 overflow-hidden text-xs text-white whitespace-nowrap  ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Volver
          </span>
        </button>
      </div>
    </div>
  )
}