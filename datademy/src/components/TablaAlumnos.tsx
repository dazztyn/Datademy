import type { Alumno } from '../types/alumno'

interface TablaAlumnosProps {
  alumnos: Alumno[]
  pagina: number
  totalPaginas: number
  onPagina: (p: number) => void
}

export default function TablaAlumnos({ alumnos, pagina, totalPaginas, onPagina }: TablaAlumnosProps) {
  if (alumnos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">No hay alumnos con los filtros seleccionados</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              {['Edad', 'Género', 'Nivel formativo', 'Sede', 'Carrera'].map(col => (
                <th key={col} className="text-left px-4 py-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {alumnos.map(alumno => (
              <tr key={alumno.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{alumno.edad}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{alumno.genero}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{alumno.nivelFormativo}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{alumno.sede}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{alumno.carrera}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Página {pagina} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPagina(pagina - 1)}
            disabled={pagina === 1}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={() => onPagina(pagina + 1)}
            disabled={pagina === totalPaginas}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  )
}