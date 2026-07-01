import { useState } from 'react'
import { crearFormulario } from '../services/formularios_service'
import { useToast } from '../hooks/useToast' 
import Toast from '../components/Toast'
interface ModalCrearProcesoProps {
  onCerrar: () => void
  onCreado: () => void
}

export default function ModalCrearProceso({ onCerrar, onCreado }: ModalCrearProcesoProps) {
  const [nombre, setNombre] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [save, setSave] = useState(false)
  const { toast, mostrar, cerrar } = useToast()

  const handleCrear = async () => {
   if (!nombre.trim()) {
      return mostrar('Por favor ingrese un nombre para el proceso', 'error')
    }
    setSave(true)
    mostrar('Creando nuevo proceso...', 'cargando')
    try {
      await crearFormulario(nombre.trim(), year)
      mostrar('Proceso creado correctamente', 'exito')
      setTimeout(() => {
        onCreado()
        onCerrar()
      }, 800)
    } catch {
      mostrar('Error al crear el proceso, por favor intente de nuevo', 'error')
    } finally {
      setSave(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4 ml-1">
          Nuevo proceso
        </h2>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-md text-slate-600 dark:text-slate-400 mb-1 block ml-1">
              Nombre del proceso
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Proceso Informática - Semestre 2"
              className="w-full border  border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="text-md text-slate-600 dark:text-slate-400 mb-1 block ml-1">
              Año
            </label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={save || !nombre.trim()}
            className="flex-1 transition-all text-white text-md font-medium py-2.5 rounded-xl disabled:opacity-60 hover:opacity-95 bg-gradient-to-r from-[#5fb7bb] to-[#0d438b] shadow-md shadow-blue-900/10"
          >
            {save ? 'Creando proceso...' : 'Crear proceso'}
          </button>
        </div>
      </div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}