interface ModalRespuestasProps {
  respuesta: Record<string, any>
  onCerrar: () => void
}

const campos = ['id_respuesta', 'fecha', 'edad', 'genero', 'nivel_formativo', 'sede', 'carrera']

export default function ModalRespuestas({ respuesta, onCerrar }: ModalRespuestasProps) {
  const preguntas = Object.entries(respuesta).filter(
    ([key]) => !campos.includes(key)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Respuestas
          </h2>
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {preguntas.map(([pregunta, valor]) => (
            <div
              key={pregunta}
              className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
            >
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{pregunta}</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{valor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}