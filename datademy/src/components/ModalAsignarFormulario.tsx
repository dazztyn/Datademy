import { useEffect, useState } from 'react'
import type { Plantilla } from '../types/formulario'
import { obtenerPlantillas, vincularFormulario } from '../services/formularios_service'

interface ModalAsignarFormularioProps {
  idProceso: string
  tipoFormulario: 'estudiantes' | 'socios'
  onCerrar: () => void
  onAsignado: () => void
}

export default function ModalAsignarFormulario({
  idProceso,
  tipoFormulario,
  onCerrar,
  onAsignado,
}: ModalAsignarFormularioProps) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seleccionada, setSeleccionada] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorAlGuardar, setErrorAlGuardar] = useState<string | null>(null) //Era más facil así, no lo cuestionen

    useEffect(() => {
      obtenerPlantillas(tipoFormulario)
        .then(setPlantillas)
        .catch(() => setError('No se pudieron cargar las plantillas'))
        .finally(() => setLoading(false))
    }, [])
  const handleVincular = async () => {
    if (!seleccionada) return setErrorAlGuardar('Por favor seleccione una plantilla')
    if (!nombre.trim()) return setErrorAlGuardar('Por favor ingrese un nombre para el formulario')
    setGuardando(true)
    setErrorAlGuardar(null)
    try {
      await vincularFormulario(idProceso, seleccionada, nombre.trim(), tipoFormulario)
      onAsignado()
      onCerrar()
    } catch {
      setErrorAlGuardar('Error al asignar, por favor intente de nuevo')
    } finally {
      setGuardando(false)
    }
  }

  const labelTipo = tipoFormulario === 'estudiantes' ? 'Estudiantes' : 'Socios'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Asignar formulario
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Tipo: <span className="font-medium text-slate-500 dark:text-slate-300">{labelTipo}</span>
        </p>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">
              Cargando plantillas...
            </p>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400 py-4 text-center">{error}</p>
        )}
        {!loading && !error && (
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

        {!loading && !error && (
          <div className="mb-4">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              Nombre del formulario
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Encuesta estudiantes 202X"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}

        {errorAlGuardar && (
          <p className="text-xs text-red-400 mb-3">{errorAlGuardar}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleVincular}
            disabled={guardando || loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
          >
            {guardando ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}