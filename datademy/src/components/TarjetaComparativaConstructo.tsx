import { useState } from 'react'
import type { ItemComparativoNormalizado } from '../utils/comparativas'

export default function TarjetaComparativaConstructo({
  item,
  colorPorValor,
  formatearValor,
  maxEscala,
}: {
  item: ItemComparativoNormalizado
  colorPorValor: (valor: number) => string
  formatearValor: (valor: number) => string
  maxEscala: number
}) {
  const [expandido, setExpandido] = useState(false)

  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-md font-medium text-slate-700 dark:text-slate-200">{item.nombreConstructo}</p>
        <span className="text-md font-bold" style={{ color: colorPorValor(item.valorGeneral) }}>
          {formatearValor(item.valorGeneral)}
        </span>
      </div>

      <div className="space-y-1.5">
        {item.detalleProcesos.map(d => (
          <div key={d.nombre_proceso} className="flex items-center gap-2">
            <span className="text-sm text-slate-700 dark:text-slate-200 w-32 truncate flex-shrink-0">
              {d.nombre_proceso}
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (d.valor / maxEscala) * 100)}%`,
                  backgroundColor: colorPorValor(d.valor),
                }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-10 text-right flex-shrink-0">
              {formatearValor(d.valor)}
            </span>
          </div>
        ))}
      </div>

      {item.preguntas.length > 0 && (
        <>
          <button
            onClick={() => setExpandido(e => !e)}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors mt-3"
          >
            {expandido ? 'Ocultar detalle por pregunta' : `Ver detalle por pregunta (${item.preguntas.length})`}
          </button>

          {expandido && (
            <div className="mt-3 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
              {item.preguntas.map((p, i) => (
                <div key={i}>
                  <p
                    className="text-sm text-slate-700 dark:text-slate-200 mb-1"
                    title={p.texto}
                  >
                    {p.texto}
                  </p>
                  <p
                    className="text-sm font-semibold mb-1.5"
                    style={{ color: colorPorValor(p.valorGeneral) }}
                  >
                    Promedio entre los {item.detalleProcesos.length} campos: {formatearValor(p.valorGeneral)}
                  </p>
                  <div className="space-y-1">
                    {p.detalleProcesos.map(d => (
                      <div key={d.nombre_proceso} className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 dark:text-slate-200 w-32 truncate flex-shrink-0">
                          {d.nombre_proceso}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (d.valor / maxEscala) * 100)}%`,
                              backgroundColor: colorPorValor(d.valor),
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-200 w-10 text-right flex-shrink-0">
                          {formatearValor(d.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
