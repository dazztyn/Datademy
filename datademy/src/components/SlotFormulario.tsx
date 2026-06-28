import { useState, useRef, useEffect } from 'react'
import ModalAsignarFormulario from './ModalAsignarFormulario'
import ModalVincularExistente from './ModalVincularExistente'
import { createPortal } from 'react-dom'
import ModalConfirmar from './ModalConfirmar'
import { desasignarFormulario } from '../services/formularios_service'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'

interface SlotFormularioProps {
  label: string
  asignado: string | null
  idGoogleForm: string | null
  idProceso: string
  tipo: 'estudiantes' | 'socios'
  onAsignado: () => void
}

export default function SlotFormulario({ label, asignado, idGoogleForm, idProceso, tipo, onAsignado }: SlotFormularioProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalExistenteAbierto, setModalExistenteAbierto] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [mostrarDesasignar, setMostrarDesasignar] = useState(false)
  const [desasignando, setDesasignando] = useState(false)
  const { toast, mostrar, cerrar } = useToast()

  const abrirMenu = () => {
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    })
  }
  setMenuAbierto(true)
}
  const handleDesasignar = async () => {
    setDesasignando(true)

    try {
      await desasignarFormulario(idProceso, tipo)

      onAsignado() 
      setMostrarDesasignar(false)
    } catch (err) {
      console.error('Error al desasignar', err)
      mostrar('Error al desasignar el formulario. Intenta de nuevo.', 'error')
    } finally {
      setDesasignando(false)
    }
  }
  return (
    <>
      <div className="rounded-xl p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
        {asignado ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
              {asignado}
            </p>
            {idGoogleForm && (
              <a
                href={`https://docs.google.com/forms/d/${idGoogleForm}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline transition-colors"
              >
                Abrir en Google Forms →
              </a>
            )}
            <div className="relative">
      <button
        ref={menuRef}
        onClick={abrirMenu}
        className="text-xs text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
      >
        Opciones
            </button>

            {menuAbierto && createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuAbierto(false)}
                    />
                    <div
                      className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-44"
                      style={{ top: menuPos.top, left: menuPos.left }}
                    >
                      <button
                        onClick={() => { setMenuAbierto(false); setModalAbierto(true) }}
                        className="w-full text-left px-3 py-2 text-xs text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        ↺ Reasignar con plantilla
                      </button>
                      <button
                        onClick={() => { setMenuAbierto(false); setModalExistenteAbierto(true) }}
                        className="w-full text-left px-3 py-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        ↺ Reasignar con existente
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                      <button
                        onClick={() => { setMenuAbierto(false); setMostrarDesasignar(true)}}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        ✕ Desasignar
                      </button>
                    </div>
                  </>,
                  document.body
                )}
          </div>
        </div>
      ) : (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setModalAbierto(true)}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors text-left"
            >
              + Crear nuevo desde plantilla
            </button>
            <button
              onClick={() => setModalExistenteAbierto(true)}
              className="text-xs text-purple-900 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors text-left"
            >
              + Vincular formulario existente
            </button>
          </div>
        )}
        
      </div>

      {modalAbierto && (
        <ModalAsignarFormulario
          idProceso={idProceso}
          tipoFormulario={tipo}
          onCerrar={() => setModalAbierto(false)}
          onAsignado={onAsignado}
        />
      )}
      {modalExistenteAbierto && (
        <ModalVincularExistente
          idProceso={idProceso}
          tipoFormulario={tipo}
          onCerrar={() => setModalExistenteAbierto(false)}
          onVinculado={onAsignado}
        />
      )}
      {mostrarDesasignar && (
        <ModalConfirmar
          mensaje={`Se desasignará el formulario de ${tipo}.`}
          onConfirmar={handleDesasignar}
          onCerrar={() => setMostrarDesasignar(false)}
          cargando={desasignando}
        />
      )}
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </>
  )
}