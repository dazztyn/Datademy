import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import type { FiltrosMetricas } from '../../../services/estadisticos_service'
import { useTheme } from '../../../context/ThemeContext'
import { temasPagina, temaDefault } from '../../../utils/temasPagina'
import { useLocation } from 'react-router-dom'
import { useFiltrosDisponibles } from '../../../hooks/useFiltrosDisponibles'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function interpretarAlfa(alfa: number): { texto: string; color: string } {
  if (alfa >= 0.9) return { texto: 'Excelente', color: '#22c55e' }
  if (alfa >= 0.8) return { texto: 'Bueno', color: '#84cc16' }
  if (alfa >= 0.7) return { texto: 'Aceptable', color: '#eab308' }
  if (alfa >= 0.6) return { texto: 'Cuestionable', color: '#f97316' }
  return { texto: 'Inaceptable', color: '#ef4444' }
}

export default function Cronbach() {
  const { idProceso } = useProceso()
  const [tipoActivo, setTipoActivo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const [filtros, setFiltros] = useState<FiltrosMetricas>({ tipo: 'estudiantes' })
  const { metricas, cargando, error } = useMetricas(idProceso, filtros)
  const { theme } = useTheme()
  const location = useLocation()
  const tema = temasPagina[location.pathname] ?? temaDefault
  const { filtros: filtrosDisponibles } = useFiltrosDisponibles(idProceso, tipoActivo)
  const colorTexto = theme === 'dark' ? 'white' : tema.sidebar
  const colorGrid = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  useEffect(() => {
    setFiltros({ tipo: tipoActivo })
  }, [tipoActivo])

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">No hay proceso seleccionado. Vuelve al inicio y selecciona uno.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Filtros</h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    
    <div>
      <label className="text-xs text-slate-400 mb-1 block">Constructo / Dimensión</label>
      <select
        value={filtros.pagina ?? ''}
        onChange={e => setFiltros(f => ({ ...f, pagina: e.target.value ? Number(e.target.value) : undefined }))}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Todos los constructos</option>
        {filtrosDisponibles?.nombres_constructos?.map((c: { id: number; nombre: string }) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
    </div>

    {tipoActivo === 'estudiantes' && filtrosDisponibles?.carreras && (
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Carrera</label>
        <select
          value={filtros.carrera ?? ''}
          onChange={e => setFiltros(f => ({ ...f, carrera: e.target.value || undefined }))}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Todas las carreras</option>
          {filtrosDisponibles.carreras.map((c: string) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    )}

  </div>
</div>

      {cargando && <p className="text-center text-white/70 text-sm py-8 animate-pulse">Cargando análisis...</p>}
      {error && <p className="text-center text-red-300 text-sm py-8">{error}</p>}

      {metricas && !cargando && metricas.fiabilidad_constructos.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-400 text-sm">No hay datos de fiabilidad disponibles para los filtros seleccionados.</p>
        </div>
      )}

      {metricas && !cargando && metricas.fiabilidad_constructos.map(constructo => {
        const interpretacion = interpretarAlfa(constructo.alfa_cronbach_global)

        const etiquetas = Object.keys(constructo.alfa_si_se_elimina_pregunta).map(
            (_, i) => `Pregunta ${i + 1}`
            )
        const valores = Object.values(constructo.alfa_si_se_elimina_pregunta)

        const datosBarras = {
          labels: etiquetas,
          datasets: [{
            label: 'Alfa si se elimina',
            data: valores,
            backgroundColor: valores.map(interpretarAlfa).map(i => i.color),
            borderRadius: 6,
          }]
        }

        return (
          <div
            key={constructo.numero_pagina}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {metricas.promedios_por_pagina.find(p => p.numero_pagina === constructo.numero_pagina)?.nombre_constructo
                  ?? `Constructo — ${constructo.numero_pagina}`}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">α global</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: interpretacion.color }}
                >
                  {constructo.alfa_cronbach_global.toFixed(3)}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: interpretacion.color }}
                >
                  {interpretacion.texto}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Hacer hover sobre las preguntas muestra cuanto su eliminación aumentaría el alfa del constructo.
            </p>

            <div style={{ height: `${etiquetas.length * 40 + 40}px` }}>
              <Bar
                key={`cronbach-${constructo.numero_pagina}-${theme}`}
                data={datosBarras}
                options={{
                  indexAxis: 'y',
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      min: 0,
                      max: 1,
                      ticks: { color: colorTexto },
                      grid: { color: colorGrid },
                    },
                    y: {
                      ticks: { color: colorTexto, font: { size: 10 } },
                      grid: { color: colorGrid },
                    },
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: theme === 'dark' ? tema.sidebar : 'white',
                      titleColor: theme === 'dark' ? 'white' : tema.sidebar,
                      bodyColor: theme === 'dark' ? 'white' : tema.sidebar,
                      callbacks: {
                        title: ctx => {
                            const preguntasCompletas = Object.keys(constructo.alfa_si_se_elimina_pregunta)
                            return preguntasCompletas[ctx[0].dataIndex]
                        },
                        label: ctx => `α sin esta pregunta: ${Number(ctx.raw).toFixed(3)}`
                        }
                    },
                  },
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}