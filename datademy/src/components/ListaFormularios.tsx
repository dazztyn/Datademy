import SlotFormulario from './SlotFormulario'

interface Periodo {
  id: string
  nombreProceso: string
  anio: string
  formularioAlumnos: string | null
  formularioClientes: string | null
}

interface ListaFormulariosProps {
  periodos: Periodo[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
}

export default function ListaFormularios({ periodos, seleccionado, onSeleccionar }: ListaFormulariosProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
        {periodos.map(periodo => {
          const activo = seleccionado === periodo.id
          const completo = periodo.formularioAlumnos !== null && periodo.formularioClientes !== null

          return (
            <div
              key={periodo.id}
              onClick={() => onSeleccionar(periodo.id)}
              className={`px-5 py-4 cursor-pointer transition-colors
                ${activo
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`font-medium text-sm ${activo ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {periodo.nombreProceso}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {periodo.anio}
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

              <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
                <SlotFormulario label="Estudiantes" asignado={periodo.formularioAlumnos} />
                <SlotFormulario label="Socios" asignado={periodo.formularioClientes} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}