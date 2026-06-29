
import SlotFormulario from './SlotFormulario'
import ModalConfirmar from './ModalConfirmar'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  eliminarProceso,
  desasignarFormulario
} from '../services/formularios_service'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'

interface Periodo {
  id: string
  nombreProceso: string
  year: string
  formularioAlumnos: string | null
  formularioClientes: string | null
  idGoogleFormAlumnos: string | null
  idGoogleFormClientes: string | null
}

interface ListaFormulariosProps {
  periodos: Periodo[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
  onReload: () => void
  onEliminar?: () => void
}
export default function ListaFormularios({ periodos, seleccionado, onSeleccionar, onReload, onEliminar }: ListaFormulariosProps) {
  const [procesoAEliminar, setProcesoAEliminar] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const { toast, mostrar, cerrar } = useToast()

  const handleEliminar = async () => {
    if (!procesoAEliminar) return
    setEliminando(true)
    try {
      await eliminarProceso(procesoAEliminar)
      mostrar('Formulario eliminado con éxito', 'exito')
      onReload()
      onEliminar?.()
      setProcesoAEliminar(null)
    } catch (err) {
      console.error('Error al desasignar', err)
      mostrar('Error al eliminar. Intenta de nuevo.', 'error')
    } finally {
      setEliminando(false)
    }
  }
  const menuRef = useRef<HTMLButtonElement>(null)

  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const [procesoADesasignar, setProcesoADesasignar] = useState<string | null>(null)
  const [desasignando, setDesasignando] = useState(false)
  const abrirMenu = (
  idProceso: string,
  elemento: HTMLButtonElement
) => {
  const rect = elemento.getBoundingClientRect()

  setMenuPos({
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX
  })

  setMenuAbierto(idProceso)
}

useEffect(() => {
  const manejarCierreFlotante = () => {
    if (menuAbierto !== null) {
      setMenuAbierto(null); 
    }
  };

  if (menuAbierto !== null) {
    window.addEventListener('scroll', manejarCierreFlotante, true);
    window.addEventListener('resize', manejarCierreFlotante);
  }

  return () => {
    window.removeEventListener('scroll', manejarCierreFlotante, true);
    window.removeEventListener('resize', manejarCierreFlotante);
  };
}, [menuAbierto]);
const handleDesasignarTodo = async () => {
  if (!procesoADesasignar) return

  const proceso = periodos.find(
    p => p.id === procesoADesasignar
  )

  if (!proceso) return

  setDesasignando(true)

  try {
    const promesas = []

    if (proceso.formularioAlumnos) {
      promesas.push(
        desasignarFormulario(
          proceso.id,
          'estudiantes'
        )
      )
    }

    if (proceso.formularioClientes) {
      promesas.push(
        desasignarFormulario(
          proceso.id,
          'socios'
        )
      )
    }

    await Promise.all(promesas)
    mostrar('Formulario desasignado con éxito', 'exito')
    onReload()
    setProcesoADesasignar(null)

  } catch (err) {
    console.error(err)
    mostrar('Error al desasignar. Intenta de nuevo.', 'error')
  } finally {
    setDesasignando(false)
  }
}

  return (
    <>
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
          {periodos.map(periodo => {
            const activo = seleccionado === periodo.id
            const completo = periodo.formularioAlumnos !== null && periodo.formularioClientes !== null

            return (
              <div
                key={periodo.id}
                onClick={() => onSeleccionar(periodo.id)}
                className={`px-5 py-4 cursor-pointer transition-colors relative
                  ${activo
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <button
                    ref={menuRef}
                    title='Opciones de proceso'
                    onClick={e => {
                      e.stopPropagation()
                      abrirMenu(periodo.id, e.currentTarget)
                    }}
                    className="rounded-full border border-green-500 dark:border-green-600 bg-green-100 dark:bg-green-900 absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-green-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs"
                  >
                    ⋮
                  </button>
                  {menuAbierto === periodo.id &&
                  createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuAbierto(null)}
                      />

                      <div
                        className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-52"
                        style={{
                          top: menuPos.top,
                          left: menuPos.left
                        }}
                      >
                        <button
                          onClick={() => {
                            setMenuAbierto(null)
                            setProcesoADesasignar(periodo.id)
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          ↺ Desasignar formularios
                        </button>

                        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                        <button
                          onClick={() => {
                            setMenuAbierto(null)
                            setProcesoAEliminar(periodo.id)
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          ✕ Eliminar proceso
                        </button>
                      </div>
                    </>,
                    document.body
                )}
                <div className="flex items-center justify-between mb-3 pr-6">
                  <div>
                    <p className={`font-medium text-sm ${activo ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {periodo.nombreProceso}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {periodo.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      completo
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                    }`}>
                      {completo ? 'Completo' : 'Incompleto'}
                    </span>
                    {activo && (
                      <span className="text-amber-500 dark:text-amber-400 text-lg">›</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full" onClick={e => e.stopPropagation()}>
                  <SlotFormulario
                    label="Estudiantes"
                    asignado={periodo.formularioAlumnos}
                    idGoogleForm={periodo.idGoogleFormAlumnos}
                    idProceso={periodo.id}
                    tipo="estudiantes"
                    onAsignado={onReload}
                  />
                  <SlotFormulario
                    label="Socios"
                    asignado={periodo.formularioClientes}
                    idGoogleForm={periodo.idGoogleFormClientes}
                    idProceso={periodo.id}
                    tipo="socios"
                    onAsignado={onReload}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {procesoAEliminar && (
        <ModalConfirmar
          mensaje="Esta acción eliminará el proceso y todos sus formularios asociados. No se puede deshacer."
          onConfirmar={handleEliminar}
          onCerrar={() => setProcesoAEliminar(null)}
          cargando={eliminando}
        />
      )}
      {procesoADesasignar && (
        <ModalConfirmar
          mensaje="Se desasignarán todos los formularios asociados al proceso."
          onConfirmar={handleDesasignarTodo}
          onCerrar={() => setProcesoADesasignar(null)}
          cargando={desasignando}
        />
      )}
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}{toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </>
  )
}