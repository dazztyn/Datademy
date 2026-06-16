interface ModalRespuestasProps {
  respuesta: Record<string, any>
  onCerrar: () => void
}

const campos = ['id_respuesta', 'fecha', 'edad', 'genero', 'nivel_formativo', 'sede', 'carrera', 'nombre', 'organizacion']

const escala: Record<number, string> = {
  1: 'Totalmente en desacuerdo',
  2: 'En desacuerdo',
  3: 'De acuerdo',
  4: 'Totalmente de acuerdo',
}
const detectSatisfaccion = (pregunta: string) =>
  pregunta.toLowerCase().includes('satisfacción general')

const detectAbierta = (valor: any) => typeof valor === 'string'

function formatearValor(pregunta: string, valor: any): string {
  if (detectAbierta(valor)) return valor
  if (detectSatisfaccion(pregunta)) return `${valor} / 7`
  const etiqueta = escala[Number(valor)]
  return etiqueta ? `${valor} — ${etiqueta}` : String(valor)
}

export default function ModalRespuestas({ respuesta, onCerrar }: ModalRespuestasProps) {
  const preguntas = Object.entries(respuesta).filter(
    ([key]) => !campos.includes(key)
  )

      return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onCerrar}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
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
                <p className={`text-sm font-medium ${
                  detectAbierta(valor)
                    ? 'text-slate-600 dark:text-slate-300 italic'
                    : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {formatearValor(pregunta, valor)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
}