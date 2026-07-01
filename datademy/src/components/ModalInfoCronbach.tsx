interface ModalInfoCronbachProps {
  onCerrar: () => void
}

const RANGOS_CRONBACH = [
  { rango: 'α ≥ 0.9', texto: 'Excelente', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  { rango: '0.8 ≤ α < 0.9', texto: 'Bueno', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.1)' },
  { rango: '0.7 ≤ α < 0.8', texto: 'Aceptable', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
  { rango: '0.6 ≤ α < 0.7', texto: 'Cuestionable', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  { rango: 'α < 0.6', texto: 'Inaceptable', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
]

export default function ModalInfoCronbach({ onCerrar }: ModalInfoCronbachProps) {
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
            Interpretación de Alfa de Cronbach
          </h2>
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          El Alfa de Cronbach es un coeficiente utilizado para medir la <strong>consistencia interna y fiabilidad</strong> de un conjunto de preguntas (escala). Varía entre 0 y 1, donde un valor más alto indica que las preguntas miden el mismo constructo de forma estable.
        </p>

        <div className="flex flex-col gap-2.5">
          {RANGOS_CRONBACH.map((item) => (
            <div
              key={item.texto}
              className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3.5"
            >
              <div>
                <span 
                  className="text-xs px-2 py-0.5 rounded-md font-semibold text-white mr-2"
                  style={{ backgroundColor: item.color }}
                >
                  {item.texto}
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  {item.rango}
                </span>
              </div>
              
              <div 
                className="w-4 h-4 rounded-full shadow-inner animate-pulse"
                style={{ backgroundColor: item.color }}
              />
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 italic text-center">
          *Las barras del gráfico muestran qué pasaría con el Alfa global si decides eliminar esa pregunta específica del formulario.
        </p>
      </div>
    </div>
  )
}