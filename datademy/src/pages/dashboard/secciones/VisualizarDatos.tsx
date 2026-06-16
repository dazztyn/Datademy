import { useState, useEffect } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import { useFiltrosDisponibles } from '../../../hooks/useFiltrosDisponibles'
import type { FiltrosMetricas } from '../../../services/estadisticos_service'
import { useTheme } from '../../../context/ThemeContext'
import { temasPagina, temaDefault } from '../../../utils/temasPagina'
import { useLocation } from 'react-router-dom'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const COLORES = ['#5fb7bb', '#0d438b', '#7f458f']


function fmt(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return '—'
  return value.toFixed(decimals)
}

export default function Visualizar() {
  const [tipoActivo, setTipoActivo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const { idProceso } = useProceso()
  const [filtros, setFiltros] = useState<FiltrosMetricas>({ tipo: 'estudiantes' })
  const { metricas, cargando, error } = useMetricas(idProceso, filtros)
  const { filtros: filtrosDisponibles } = useFiltrosDisponibles(idProceso, tipoActivo)
  const { theme } = useTheme()
  const location = useLocation()
  const tema = temasPagina[location.pathname] ?? temaDefault
  const [constructoSeleccionado, setConstructoSeleccionado] = useState<number | undefined>(undefined)

  const colorTexto = theme === 'dark' ? 'white' : tema.sidebar
  const colorGrid = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  useEffect(() => {
    setFiltros({ tipo: tipoActivo })
  }, [tipoActivo])

  const actualizarFiltro = (campo: keyof FiltrosMetricas, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor || undefined }))
  }

  const distribucionGenero = metricas?.distribucion_genero ?? []
  const datosGenero =
    distribucionGenero.length > 0
      ? {
          labels: distribucionGenero.map(d => d.genero),
          datasets: [
            {
              data: distribucionGenero.map(d => d.cantidad),
              backgroundColor: COLORES,
              borderWidth: 0,
            },
          ],
        }
      : null

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">
          No hay proceso seleccionado. Vuelve al inicio y selecciona uno.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center bg-emerald-700 dark:bg-slate-900/40 rounded-xl p-1">
        {(['estudiantes', 'socios'] as const).map(tipo => (
          <button
            key={tipo}
            onClick={() => setTipoActivo(tipo)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 capitalize
              ${
                tipoActivo === tipo
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-white/70 dark:text-slate-400'
              }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Filtros</h3>
        <div className="grid grid-cols-2 gap-3">
          {tipoActivo === 'estudiantes' &&
            (filtrosDisponibles.carreras ?? []).length > 0 && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Carrera</label>
                <select
                  onChange={e => actualizarFiltro('carrera', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todas</option>
                  {filtrosDisponibles.carreras!.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

          {tipoActivo === 'estudiantes' &&
            (filtrosDisponibles.sedes ?? []).length > 0 && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sede</label>
                <select
                  onChange={e => actualizarFiltro('sede', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todas</option>
                  {filtrosDisponibles.sedes!.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

          {tipoActivo === 'socios' &&
            (filtrosDisponibles.organizaciones ?? []).length > 0 && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Organización / Empresa</label>
                <select
                  onChange={e => actualizarFiltro('organizacion', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todas</option>
                  {filtrosDisponibles.organizaciones!.map(o => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}

          {(filtrosDisponibles.generos ?? []).length > 0 && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Género</label>
              <select
                onChange={e => actualizarFiltro('genero', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Todos</option>
                {filtrosDisponibles.generos!.map(g => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          {tipoActivo === 'estudiantes' &&
            (filtrosDisponibles.niveles_formativos ?? []).length > 0 && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nivel formativo</label>
                <select
                  onChange={e => actualizarFiltro('nivel_formativo', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todos</option>
                  {filtrosDisponibles.niveles_formativos!.map(n => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}

          {(filtrosDisponibles.nombres_constructos ?? []).length > 0 && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Constructo</label>
              <select
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : undefined
                  setConstructoSeleccionado(val)
                  actualizarFiltro('pagina', val)
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Todos</option>
                {filtrosDisponibles.nombres_constructos!.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {cargando && (
        <p className="text-center text-white/70 text-sm py-8 animate-pulse">
          Cargando métricas...
        </p>
      )}
      {error && <p className="text-center text-red-300 text-sm py-8">{error}</p>}

      {metricas && !cargando && metricas.total_encuestados === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            Sin resultados para este filtro
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Prueba cambiando o quitando algún filtro para ver datos.
          </p>
        </div>
      )}

      {metricas && !cargando && metricas.total_encuestados > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Total encuestados</p>
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                {metricas.total_encuestados}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                Satisfacción general
              </p>
              <p className="text-4xl font-bold" style={{ color: tema.sidebar }}>
                {fmt(metricas.promedio_satisfaccion_general)}
              </p>
              <p className="text-xs text-slate-400 mt-1">sobre 7.0</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                Promedio preguntas
              </p>
              <p className="text-4xl font-bold" style={{ color: tema.sidebar }}>
                {fmt(metricas.promedio_satisfaccion_constructos)}
              </p>
              <p className="text-xs text-slate-400 mt-1">sobre 7.0</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Tasa de respuesta</p>
              <p className="text-4xl font-bold" style={{ color: tema.sidebar }}>
                {fmt(metricas.tasa_respuesta_porcentaje, 0)}%
              </p>
            </div>

            {datosGenero && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                  Distribución por género
                </p>
                <div className="w-full h-24">
                  <Pie
                    key={`pie-${theme}`}
                    data={datosGenero}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: colorTexto,
                            font: { size: 9 },
                            boxWidth: 10,
                          },
                        },
                        tooltip: {
                          backgroundColor:
                            theme === 'dark' ? tema.sidebar : 'white',
                          titleColor:
                            theme === 'dark' ? 'white' : tema.sidebar,
                          bodyColor:
                            theme === 'dark' ? 'white' : tema.sidebar,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bar charts per constructo */}
          {(metricas.detalle_por_dimension ?? [])
            .filter((_, i) => i < metricas.detalle_por_dimension.length - 1)
            .filter(
              c =>
                constructoSeleccionado === undefined ||
                c.numero_pagina === constructoSeleccionado
            )
            .map(constructo => {
              const preguntas = constructo.preguntas ?? []

              // Skip constructos with no questions for the current filter
              if (preguntas.length === 0) return null

              const etiquetas = preguntas.map((_, i) => `Pregunta ${i + 1}`)
              const valores = preguntas.map(p =>
                Number((p.promedio ?? 0).toFixed(2))
              )

              const datosConstructo = {
                labels: etiquetas,
                datasets: [
                  {
                    label: 'Promedio',
                    data: valores,
                    backgroundColor: tema.sidebar,
                    borderRadius: 6,
                  },
                ],
              }

              const promedio_constructo =
                (metricas.promedios_por_pagina ?? []).find(
                  p => p.numero_pagina === constructo.numero_pagina
                )?.promedio_constructo ?? 0

              return (
                <div
                  key={constructo.numero_pagina}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {constructo.nombre_constructo ??
                        `Constructo — Página ${constructo.numero_pagina}`}
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Promedio:{' '}
                      <strong style={{ color: tema.sidebar }}>
                        {fmt(promedio_constructo, 2)}
                      </strong>
                    </span>
                  </div>

                  <div style={{ height: `${preguntas.length * 44 + 40}px` }}>
                    <Bar
                      key={`bar-${constructo.numero_pagina}-${theme}`}
                      data={datosConstructo}
                      options={{
                        indexAxis: 'y',
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            min: 0,
                            max: 4,
                            ticks: { color: colorTexto },
                            grid: { color: colorGrid },
                          },
                          y: {
                            ticks: { color: colorTexto },
                            grid: { color: colorGrid },
                          },
                        },
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor:
                              theme === 'dark' ? tema.sidebar : 'white',
                            titleColor:
                              theme === 'dark' ? 'white' : tema.sidebar,
                            bodyColor:
                              theme === 'dark' ? 'white' : tema.sidebar,
                            callbacks: {
                              title: ctx =>
                                preguntas[ctx[0].dataIndex]?.pregunta ?? '',
                              label: ctx =>
                                `Promedio: ${Number(ctx.raw).toFixed(2)}`,
                            },
                          },
                        },
                        animation: false,
                      }}
                      plugins={[
                        {
                          id: `labels-${constructo.numero_pagina}`,
                          afterDatasetsDraw(chart) {
                            const { ctx } = chart
                            chart.data.datasets.forEach((_, datasetIndex) => {
                              const meta = chart.getDatasetMeta(datasetIndex)
                              meta.data.forEach((bar, index) => {
                                const value = chart.data.datasets[datasetIndex]
                                  .data[index] as number
                                ctx.save()
                                ctx.fillStyle = colorTexto
                                ctx.font = 'bold 11px sans-serif'
                                ctx.textAlign = 'left'
                                ctx.textBaseline = 'middle'
                                ctx.fillText(
                                  value.toFixed(2),
                                  bar.x + 6,
                                  bar.y
                                )
                                ctx.restore()
                              })
                            })
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              )
            })}
        </>
      )}
    </div>
  )
}
