import { useState } from 'react'
import ModalAsignarFormulario from './ModalAsignarFormulario'
import ModalVincularExistente from './ModalVincularExistente'

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
            <button
              onClick={() => setModalAbierto(true)}
              className="text-xs text-amber-500 hover:text-amber-600 dark:text-amber-400 transition-colors text-left"
            >
              ↺ Reasignar plantilla
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setModalAbierto(true)}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors text-left"
            >
              + Asignar desde plantilla
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
    </>
  )
}