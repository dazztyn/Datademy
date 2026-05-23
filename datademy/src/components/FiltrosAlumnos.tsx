import type { FiltrosAlumno } from '../types/filtrosAlumno'
import type { Genero, NivelFormativo, Sede } from '../types/alumno'

interface FiltrosAlumnosProps {
  filtros: FiltrosAlumno
  carreras: string[]
  onChange: (filtros: FiltrosAlumno) => void
  onLimpiar: () => void
}

export default function FiltrosAlumnos({ filtros, carreras, onChange, onLimpiar }: FiltrosAlumnosProps) {
  const update = (campo: keyof FiltrosAlumno, valor: string) =>
    onChange({ ...filtros, [campo]: valor })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Filtros</h3>
        <button
          onClick={onLimpiar}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          Limpiar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">Género</label>
          <select
            value={filtros.genero}
            onChange={e => update('genero', e.target.value as Genero | '')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Todos</option>
            <option>Femenino</option>
            <option>Masculino</option>
            <option>Otro</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">Nivel formativo</label>
          <select
            value={filtros.nivelFormativo}
            onChange={e => update('nivelFormativo', e.target.value as NivelFormativo | '')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Todos</option>
            <option>Pregrado</option>
            <option>Postgrado</option>
            <option>Educación continua</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">Sede</label>
          <select
            value={filtros.sede}
            onChange={e => update('sede', e.target.value as Sede | '')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Todas</option>
            <option>Coquimbo</option>
            <option>Antofagasta</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">Carrera</label>
          <select
            value={filtros.carrera}
            onChange={e => update('carrera', e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Todas</option>
            {carreras.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}