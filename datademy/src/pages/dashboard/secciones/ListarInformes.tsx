import { useEffect, useState } from 'react'
import { useProceso } from '../../../context/ProcesoContext'
import { listarInformes, eliminarInforme } from '../../../services/formularios_service'
import type { Informe } from '../../../services/formularios_service'
import ModalConfirmar from '../../../components/ModalConfirmar'
import { temasPagina, temaDefault } from '../../../utils/temasPagina'
import { useToast } from '../../../hooks/useToast'
import Toast from '../../../components/Toast'
import iconoRefresh from '../../../assets/REFRESH.png'

export default function ListarInformes() {
  const { idProceso, metadatosCompletos } = useProceso()
  const [informes, setInformes] = useState<Informe[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [informeAEliminar, setInformeAEliminar] = useState<Informe | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const { toast, mostrar, cerrar } = useToast()
  const tema = temasPagina[location.pathname] ?? temaDefault
  const cargar = () => {
    if (!idProceso) return
    setCargando(true)
    setError(null)
    listarInformes(idProceso)
      .then(setInformes)
      .catch(() => setError('No se pudieron cargar los informes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [idProceso])

  const handleEliminar = async () => {
    if (!informeAEliminar || !idProceso) return
    setEliminando(true)
    try {
      await eliminarInforme(idProceso, informeAEliminar.id_informe_drive)
      mostrar('Informe eliminado correctamente', 'exito')
      setInformeAEliminar(null)
      cargar()
    } catch {
      mostrar('Error al eliminar el informe', 'error')
    } finally {
      setEliminando(false)
    }
  }

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">No hay proceso seleccionado. Vuelve al inicio y selecciona uno.</p>
      </div>
    )
  }

  if (!metadatosCompletos) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-white/70 text-sm">Completa los metadatos del proceso para ver los informes.</p>
        <p className="text-white/40 text-xs">Ve a "Completar datos" en el menú lateral.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-white/80">Informes generados</h2>
        <div className="px-3 mb-2">
        <button
          onClick={cargar}
          title="Sincronizar datos"
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-all text-left border border-blue-50 dark:border-blue-100 text-blue-50 dark:text-blue-300 hover:text-blue-500 hover:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400"
        >
          <img
            src={iconoRefresh}
            alt="Refresh"
            className={`w-5 h-5 object-contain flex-shrink-0 brightness-0 invert ${
              cargando ? 'animate-spin' : ''
            }`}
          />
          <span className={` text-xs text-white whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 max-w-xs border-white-500`}>
            Actualizar
          </span>
        </button>
      </div>
      </div>
      
      {cargando && (
        <p className="text-center text-white/50 text-sm py-8 animate-pulse">Cargando informes...</p>
      )}

      {error && (
        <p className="text-center text-red-300 text-sm py-8">{error}</p>
      )}

      {!cargando && !error && informes.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">No hay informes generados aún</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            Genera tu primer informe desde la sección "Generar informe"
          </p>
        </div>
      )}

      {!cargando && !error && informes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {informes.map(informe => (
              <div
                key={informe.id_informe_drive}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {informe.nombre_informe}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {new Date(informe.fecha_generacion).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={informe.url_edicion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90 bg-gradient-to-r from-[#5fb7bb] to-[#0d438b]"
                  >
                    Visualizar como editor
                  </a>
                  <a
                    href={informe.url_descarga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-medium transition-opacity hover:opacity-90 bg-gradient-to-r from-[#5fb7bb] to-[#0d438b]"
                  >
                    Descargar como PDF
                  </a>
                  <button
                    onClick={() => setInformeAEliminar(informe)}
                    className="text-xs px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {informeAEliminar && (
        <ModalConfirmar
          mensaje={`¿Eliminar "${informeAEliminar.nombre_informe}"? Esta acción no se puede deshacer.`}
          onConfirmar={handleEliminar}
          onCerrar={() => setInformeAEliminar(null)}
          cargando={eliminando}
        />
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}