import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { temasPagina, temaDefault } from '../utils/temasPagina'

interface SidebarItem {
  icono: string
  titulo: string
  ruta: string
}

const items: SidebarItem[] = [
  { icono: '/src/assets/HOME.png', titulo: 'Inicio', ruta: '/detalles' },
  { icono: '/src/assets/FORUM.png', titulo: 'Formularios', ruta: '/detalles/formularios' },
  { icono: '/src/assets/DATA.png', titulo: 'Visualizar datos', ruta: '/detalles/visualizar' },
  { icono: '/src/assets/FILE.png', titulo: 'Generar informe', ruta: '/detalles/informe' },
]

export default function Sidebar() {
  const [expandida, setExpandida] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const tema = temasPagina[location.pathname] ?? temaDefault

  return (
    <div
      onMouseEnter={() => setExpandida(true)}
      onMouseLeave={() => setExpandida(false)}
      className="h-screen sticky top-0 flex flex-col py-6 gap-1 transition-all duration-300 ease-in-out z-40 shadow-lg"
      style={{
        backgroundColor: tema.sidebar,
        width: expandida ? '13rem' : '4rem',
      }}
    >

      <div className="flex items-center mb-6 px-4 overflow-hidden">
        <span className="text-white text-xl flex-shrink-0"></span>
        <span
          className={`ml-3 text-sm font-semibold text-white whitespace-nowrap transition-all duration-300
            ${expandida ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}
        >
          Datademy
        </span>
      </div>

      {items.map(item => {
        const activo = location.pathname === item.ruta
        return (
          <button
            key={item.ruta}
            onClick={() => navigate(item.ruta)}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all duration-150 text-left
              ${activo
                ? 'bg-white/20'
                : 'hover:bg-white/10'
              }`}
          >
            <img
              src={item.icono}
              alt={item.titulo}
              className="w-6 h-6 flex-shrink-0 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span
              className={`text-sm font-medium text-white whitespace-nowrap overflow-hidden transition-all duration-300
                ${expandida ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}
            >
              {item.titulo}
            </span>
          </button>
        )
      })}
    </div>
  )
}