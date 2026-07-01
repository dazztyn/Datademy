import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { temasPagina, temaDefault } from '../utils/temasPagina'
import { useProceso } from '../context/ProcesoContext'
import { useInforme } from '../context/InformeContext'
import { useAuth } from '../context/AuthContext'

import ModalConfirmar from './ModalConfirmar'
import iconoListar from '../assets/LIST.png'
import iconoGraficos from '../assets/DATA.png'
import iconoCronbach from '../assets/ALPHA.png'
import iconoRefresh from '../assets/REFRESH.png'
import iconoVolver from '../assets/HOME.png'
import iconoCompletar from '../assets/CHECK_COSA.png'
import iconoLock from '../assets/LOCK.png' 
import iconoLogout from '../assets/LOGOUT.png'
import iconoInformes from '../assets/INFORME.png'

interface SidebarItem {
  icono: string
  titulo: string
  ruta: string
}
interface SidebarProps {
  sync?: boolean
  onSincronizar?: () => void
}

const items: SidebarItem[] = [
  { icono: iconoListar, titulo: 'Listar resultados', ruta: '/detalles/listado' },
  { icono: iconoGraficos, titulo: 'Gráficos generales', ruta: '/detalles/graficos' },
  { icono: iconoCronbach, titulo: 'Alfa de Cronbach', ruta: '/detalles/cronbach' },
]

export default function Sidebar({ sync = false, onSincronizar }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const { idProceso, metadatosCompletos, verificandoMetadatos } = useProceso()
  const { estadoJob } = useInforme()
  const temaBarra = temasPagina[location.pathname] ?? temaDefault
  
  const { cerrarSesion } = useAuth()

const [mostrarLogout, setMostrarLogout] = useState(false)
const [cerrandoSesion, setCerrandoSesion] = useState(false)

const handleCerrarSesion = async () => {
  setCerrandoSesion(true)

  try {
    await cerrarSesion()
    navigate('/login')
  } finally {
    setCerrandoSesion(false)
    setMostrarLogout(false)
  }
}
  const requiereMetadatos = (ruta: string) =>
    ['/detalles/alumnos', '/detalles/socios', '/detalles/graficos', '/detalles/cronbach', '/detalles/informe'].includes(ruta)

  const handleRefresh = async () => {
    if (!idProceso || sync) return
      onSincronizar?.()
      }

  const informeBloqueado = requiereMetadatos('/detalles/informe') && !metadatosCompletos

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={`h-screen sticky top-0 flex flex-col py-4 transition-all duration-300 ease-in-out z-40 shadow-lg ${
        open ? 'w-52' : 'w-16'
      }`}
      style={{ backgroundColor: temaBarra.sidebar }}
    >
      <div className="px-3 mb-2">
        <button
          onClick={handleRefresh}
          title="Sincronizar datos"
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-all text-left"
        >
          <img
            src={iconoRefresh}
            alt="Refresh"
            className={`w-6 h-6 object-contain flex-shrink-0 brightness-0 invert ${
              sync ? 'animate-spin' : ''
            }`}
          />
          <span className={`text-md text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Sincronizar
          </span>
        </button>
      </div>

      <div className="px-3 mb-4">
        <button
          onClick={() => navigate('/detalles/completar')}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 transition-colors"
        >
          <img
            src={iconoCompletar}
            alt="Completar datos"
            className="w-6 h-6 object-contain flex-shrink-0 brightness-0 invert"
          />
          <span className={`text-md font-medium text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Completar datos
          </span>
        </button>
      </div>

      <div className="mx-3 mb-3 border-t border-white/20" />
      <div className="flex flex-col gap-1 px-2 flex-1">
        {items.map(item => {
          const activo = location.pathname === item.ruta
          const bloqueado = requiereMetadatos(item.ruta) && !metadatosCompletos
          {verificandoMetadatos && requiereMetadatos(item.ruta) && (
  <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse flex-shrink-0" />
)}
          return (
            <button
              key={item.ruta}
              disabled={bloqueado}
              onClick={() => { if (!bloqueado) navigate(item.ruta) }}
              title={bloqueado ? 'Completa los metadatos primero' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left w-full
                ${activo ? 'bg-white/20 font-semibold' : ''}
                ${bloqueado ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
            >
              <span className="relative flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <img
                  src={bloqueado ? iconoLock : item.icono}
                  alt={item.titulo}
                  className="w-6 h-6 object-contain brightness-0 invert"
                />
                {verificandoMetadatos && requiereMetadatos(item.ruta) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                )}
              </span>
              <span className={`text-md font-medium text-white whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
                {item.titulo}
              </span>
            </button>
          )
        })}
      </div>

      <div className="px-3 flex flex-col gap-2 mt-4">
        <button
  disabled={informeBloqueado}
  onClick={() => { if (!informeBloqueado) navigate('/detalles/informe') }}
  title={informeBloqueado ? 'Completa los metadatos primero' : undefined}
  className={`flex items-center flex-nowrap gap-3 px-3 py-2.5 rounded-xl bg-white transition-all w-full
    ${informeBloqueado ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
>
  
  <span className="relative flex-shrink-0 flex items-center justify-center w-6 h-6">
    {informeBloqueado ? (
      <img
        src={iconoLock}
        alt="Bloqueado"
        className="w-4 h-4 object-contain"
      />
    ) : (
      <>
        <span
          className={`text-xl font-bold transition-all duration-300 ${
            estadoJob === 'procesando' ? 'animate-pulse' : ''
          }`}
          style={{
            color:
              estadoJob === 'completado'
                ? '#22c55e'
                : temaBarra.sidebar
          }}
        >
          π
        </span>

        {estadoJob === 'procesando' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        )}

        {estadoJob === 'completado' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
        )}
      </>
    )}
  </span>

  <p
    className={`text-md font-semibold whitespace-nowrap transition-all duration-300 ${
      open
        ? 'opacity-100 max-w-xs'
        : 'opacity-0 max-w-0'
    }`}
    style={{ color: temaBarra.sidebar }}
  >
    Generar informe
  </p>

</button>
        <button
          disabled={informeBloqueado}
          onClick={() => { if (!informeBloqueado) navigate('/detalles/listar-informes') }}
          title={informeBloqueado ? 'Completa los metadatos primero' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all overflow-hidden w-full
            ${informeBloqueado ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
        >
          <img
            src={informeBloqueado ? iconoLock : iconoInformes}
            alt="Listar informes"
            className="w-6 h-6 object-contain flex-shrink-0 brightness-0 invert"
          />
          <span className={`text-md text-white font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Informes Creados
          </span>
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <img src={iconoVolver} alt="Volver al dashboard" className="w-6 h-6 object-contain flex-shrink-0 brightness-0 invert" />
          <span className={`transition-all duration-300 overflow-hidden text-md text-white whitespace-nowrap ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Volver
          </span>
        </button>
        <button
          onClick={() => setMostrarLogout(true)}
          title="Cerrar sesión"
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/20 transition-colors w-full"
        >
          <img src={iconoLogout} alt="Cerrar sesión" className="w-6 h-6 object-contain flex-shrink-0 brightness-0 invert" />
          <span className={`transition-all duration-300 overflow-hidden text-md text-white whitespace-nowrap ${open ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            Cerrar sesión
          </span>
        </button>
      </div>

      {mostrarLogout && (
        <ModalConfirmar
          mensaje="Se cerrará tu sesión actual."
          onConfirmar={handleCerrarSesion}
          onCerrar={() => setMostrarLogout(false)}
          cargando={cerrandoSesion}
        />
      )}
    </div>
  )
}