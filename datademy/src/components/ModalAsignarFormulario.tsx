import { useEffect, useState } from 'react'
import type { Plantilla } from '../types/formulario'
import { obtenerPlantillas, vincularFormulario } from '../services/formularios_service'
import { useToast } from '../hooks/useToast' 
import Toast from './Toast.tsx'
interface ModalAsignarFormularioProps {
  idProceso: string
  tipoFormulario: 'estudiantes' | 'socios'
  onCerrar: () => void
  onAsignado: () => void
  onVincularExistente?: () => void
}

export default function ModalAsignarFormulario({
  idProceso,
  tipoFormulario,
  onCerrar,
  onAsignado,
  onVincularExistente,
}: ModalAsignarFormularioProps) {
  const { toast, mostrar, cerrar } = useToast()
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionada, setSeleccionada] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)

    useEffect(() => {
      obtenerPlantillas(tipoFormulario)
        .then(setPlantillas)
        .catch(() => mostrar('No se pudieron cargar las plantillas', 'error'))
        .finally(() => setLoading(false))
    }, [])
  const handleVincular = async () => {
    if (!seleccionada) {
      return mostrar('Por favor seleccione una plantilla', 'error')
    }
    if (!nombre.trim()) {
      return mostrar('Por favor ingrese un nombre para el formulario', 'error')
    }
    setGuardando(true)
    mostrar('Asignando formulario...', 'cargando')
    try {
      await vincularFormulario(idProceso, seleccionada, nombre.trim(), tipoFormulario)
      mostrar('Formulario asignado con éxito', 'exito')
      setTimeout(() => {
        onAsignado()
        onCerrar()
      }, 800)
    } catch {
      mostrar('Error al asignar, por favor intente de nuevo', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const labelTipo = tipoFormulario === 'estudiantes' ? 'Estudiantes' : 'Socios'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Asignar formulario
        </h2>
        <p className="text-md text-slate-400 dark:text-slate-500 mb-4">
          Tipo: <span className="font-medium text-slate-500 dark:text-slate-300">{labelTipo}</span>
        </p>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">
              Cargando plantillas...
            </p>
          </div>
        )}
        {!loading && (
          <div className="mb-4 max-h-48 overflow-y-auto flex flex-col gap-2">
            {plantillas.map(plantilla => (
              <button
                key={plantilla.idPlantilla}
                onClick={() => setSeleccionada(plantilla.idPlantilla)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all duration-150
                  ${seleccionada === plantilla.idPlantilla
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                {plantilla.nombrePlantilla}
              </button>
            ))}
          </div>
        )}

        {!loading && (
          <div className="mb-4">
            <label className="text-md text-slate-600 dark:text-slate-400 mb-1 block ml-1">
              Nombre del formulario
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Encuesta estudiantes 202X"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}

        {onVincularExistente && (
          <p className="text-center text-md text-slate-400 dark:text-slate-500 mt-2">
            ¿Ya tienes un formulario creado?{' '}
            <button
              onClick={() => {
                onCerrar()
                onVincularExistente()
              }}
              className="text-purple-900 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors"
            >
              Vincularlo aquí
            </button>
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleVincular}
            disabled={guardando || loading}
            className="flex-1 py-2.5 rounded-xl text-white text-md font-medium transition-all disabled:opacity-60 hover:opacity-95 bg-gradient-to-r from-[#5fb7bb] to-[#0d438b] shadow-md shadow-blue-900/10"
          >
            {guardando ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}