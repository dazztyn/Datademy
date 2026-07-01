import { useState } from 'react'
import { vincularExistente } from '../services/formularios_service'
import { useGooglePicker } from '../hooks/useGooglePicker'
import { useToast } from '../hooks/useToast' 
import Toast from '../components/Toast'

interface ModalVincularExistenteProps {
  idProceso: string
  tipoFormulario: 'estudiantes' | 'socios'
  onCerrar: () => void
  onVinculado: () => void
}

export default function ModalVincularExistente({
  idProceso,
  tipoFormulario,
  onCerrar,
  onVinculado,
}: ModalVincularExistenteProps) {
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(null)
  const [nombreSeleccionado, setNombreSeleccionado] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const { toast, mostrar, cerrar } = useToast()

  const { abrirPicker } = useGooglePicker({
    modo: 'formulario',
    onSeleccionada: (id, nombre) => {
      setIdSeleccionado(id)
      setNombreSeleccionado(nombre ?? id)
    },
  })

  const handleVincular = async () => {
    if (!idSeleccionado) {
      return mostrar('Selecciona un formulario primero', 'error')
    }
    setGuardando(true)
    mostrar('Vinculando formulario...', 'cargando')
    try {
      await vincularExistente(idProceso, idSeleccionado, tipoFormulario)
      onVinculado()
      onCerrar()
    } catch {
      mostrar('Error al vincular, probablemente ya esté asignado o no sea un formulario válido', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const labelTipo = tipoFormulario === 'estudiantes' ? 'Estudiantes' : 'Socios'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Vincular formulario existente
        </h2>
        <p className="text-md text-slate-500 dark:text-slate-500 mb-4">
          Tipo: <span className="font-medium text-slate-600 dark:text-slate-300">{labelTipo}</span>
        </p>

        <div
          onClick={abrirPicker}
          className={`mb-4 rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors
            ${idSeleccionado
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
            }`}
        >
          {idSeleccionado ? (
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300 truncate">
                {nombreSeleccionado}
              </p>
              <p className="text-xs text-slate-400 mt-1">Clic para cambiar</p>
            </div>
          ) : (
            <div>
              <p className="text-md text-slate-500 dark:text-slate-500">
                Seleccionar formulario de Google Drive
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">
                Se abrirá el selector de Google
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleVincular}
            disabled={guardando || !idSeleccionado}
            className="flex-1 py-2.5 rounded-xl text-white text-md font-medium transition-all disabled:opacity-60 hover:opacity-95 bg-gradient-to-r from-[#5fb7bb] to-[#0d438b] shadow-md shadow-blue-900/10"
          >
            {guardando ? 'Vinculando...' : 'Vincular'}
          </button>
        </div>
      </div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}