import { useState } from 'react'
import { crearFormulario } from '../services/formularios_service'

interface ModalCrearProcesoProps {
  onCerrar: () => void
  onCreado: () => void
}

export default function ModalCrearProceso({ onCerrar, onCreado }: ModalCrearProcesoProps) {
  const [nombre, setNombre] = useState('')
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCrear = async () => {
    if (!nombre.trim()) return setError('El nombre es obligatorio')
    setGuardando(true)
    setError(null)
    try {
      await crearFormulario(nombre.trim(), anio)
      onCreado()
      onCerrar()
    } catch {
      setError('Error al crear el proceso, intenta de nuevo')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Nuevo proceso
        </h2>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              Nombre del proceso
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Proceso Informática - Semestre 2"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              Año
            </label>
            <input
              type="number"
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
          >
            {guardando ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}