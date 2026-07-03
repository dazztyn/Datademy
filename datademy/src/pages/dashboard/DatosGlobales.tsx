import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useFormularios } from '../../hooks/useFormularios'
import { obtenerComparativaGlobal } from '../../services/estadisticos_service'
import type {
  ComparativaResponse,
  ComparativaAlfa,
  ComparativaPromedio,
} from '../../services/estadisticos_service'
import { useTheme } from '../../context/ThemeContext'
import { temasPagina, temaDefault } from '../../utils/temasPagina'
import ThemeToggle from '../../components/ThemeToggle'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const COLORES_PROCESO = ['#5fb7bb', '#0d438b', '#7f458f', '#f59e0b', '#22c55e', '#ef4444']

function interpretarAlfa(alfa: number): { texto: string; color: string } {
  if (alfa >= 0.9) return { texto: 'Excelente', color: '#22c55e' }
  if (alfa >= 0.8) return { texto: 'Bueno', color: '#84cc16' }
  if (alfa >= 0.7) return { texto: 'Aceptable', color: '#eab308' }
  if (alfa >= 0.6) return { texto: 'Cuestionable', color: '#f97316' }
  return { texto: 'Inaceptable', color: '#ef4444' }
}

function interpretarNps(score: number): { texto: string; color: string } {
  if (score >= 70) return { texto: 'Excelente', color: '#22c55e' }
  if (score >= 30) return { texto: 'Bueno', color: '#84cc16' }
  if (score >= 0) return { texto: 'Aceptable', color: '#eab308' }
  return { texto: 'Crítico', color: '#ef4444' }
}

interface DetalleProcesoNormalizado {
  nombre_proceso: string
  valor: number
}
interface PreguntaNormalizada {
  texto: string
  valorGeneral: number
  detalleProcesos: DetalleProcesoNormalizado[]
}
interface ItemComparativoNormalizado {
  nombreConstructo: string
  valorGeneral: number
  detalleProcesos: DetalleProcesoNormalizado[]
  preguntas: PreguntaNormalizada[]
}

function normalizarAlfas(items: ComparativaAlfa[]): ItemComparativoNormalizado[] {
  return items.map(item => ({
    nombreConstructo: item.nombre_constructo,
    valorGeneral: item.promedio_alfa_constructo,
    detalleProcesos: item.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.alfa })),
    preguntas: item.preguntas.map(p => ({
      texto: p.pregunta,
      valorGeneral: p.promedio_alfa_pregunta,
      detalleProcesos: p.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.alfa })),
    })),
  }))
}

function normalizarPromedios(items: ComparativaPromedio[]): ItemComparativoNormalizado[] {
  return items.map(item => ({
    nombreConstructo: item.nombre_constructo,
    valorGeneral: item.promedio_general_constructo,
    detalleProcesos: item.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.promedio })),
    preguntas: item.preguntas.map(p => ({
      texto: p.pregunta,
      valorGeneral: p.promedio_general_pregunta,
      detalleProcesos: p.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.promedio })),
    })),
  }))
}

function TarjetaComparativaConstructo({
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
            <span className="text-sm text-slate-400 dark:text-slate-500 w-32 truncate flex-shrink-0">
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
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-10 text-right flex-shrink-0">
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
                    className="text-sm text-slate-500 dark:text-slate-400 mb-1"
                    title={p.texto}
                  >
                    {p.texto}
                  </p>
                  <p
                    className="text-sm font-semibold mb-1.5"
                    style={{ color: colorPorValor(p.valorGeneral) }}
                  >
                    Promedio entre los {item.detalleProcesos.length} procesos: {formatearValor(p.valorGeneral)}
                  </p>
                  <div className="space-y-1">
                    {p.detalleProcesos.map(d => (
                      <div key={d.nombre_proceso} className="flex items-center gap-2">
                        <span className="text-sm text-slate-400 dark:text-slate-500 w-32 truncate flex-shrink-0">
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
                        <span className="text-sm text-slate-500 dark:text-slate-400 w-10 text-right flex-shrink-0">
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

export default function DatosGlobales() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const tema = temasPagina['/datos-globales'] ?? temaDefault
  const { formularios, cargando: cargandoFormularios } = useFormularios()
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [tipo, setTipo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const [respuesta, setRespuesta] = useState<ComparativaResponse | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colorTexto = theme === 'dark' ? 'white' : '#334155'
  const colorGrid = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

  const comparativa = respuesta?.comparativa_global ?? []
  const comparativaAlfas = respuesta?.comparativa_alfas ?? []
  const comparativaPromedios = respuesta?.comparativa_promedios ?? []

  const alfasNormalizadas = useMemo(() => normalizarAlfas(comparativaAlfas), [comparativaAlfas])
  const promediosNormalizados = useMemo(() => normalizarPromedios(comparativaPromedios), [comparativaPromedios])

  const toggleSeleccionado = (id: string) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  const handleComparar = async () => {
    if (seleccionados.size < 1) return
    setCargando(true)
    setError(null)
    try {
      const data = await obtenerComparativaGlobal(tipo, [...seleccionados])
      setRespuesta(data)
    } catch {
      setError('No se pudo obtener la comparativa')
    } finally {
      setCargando(false)
    }
  }

  const datosGrafico = useMemo(() => {
    if (comparativa.length === 0) return null

    const constructosSet = new Set<string>()
    comparativa.forEach(p =>
      p.metricas.promedios_por_pagina.forEach(c => constructosSet.add(c.nombre_constructo))
    )
    const constructos = [...constructosSet]

    return {
      labels: constructos,
      datasets: comparativa.map((proceso, i) => ({
        label: `${proceso.nombre_proceso} (${proceso.anio})`,
        data: constructos.map(nombre => {
          const c = proceso.metricas.promedios_por_pagina.find(p => p.nombre_constructo === nombre)
          return c?.promedio_constructo ?? 0
        }),
        backgroundColor: COLORES_PROCESO[i % COLORES_PROCESO.length] + 'cc',
        borderColor: COLORES_PROCESO[i % COLORES_PROCESO.length],
        borderWidth: 1,
        borderRadius: 4,
      })),
    }
  }, [comparativa])

  const maxEscalaGrafico = useMemo(() => {
    if (!datosGrafico) return 4
    const valores = datosGrafico.datasets.flatMap(d => d.data)
    if (valores.length === 0) return 4
    return Math.ceil(Math.max(4, ...valores))
  }, [datosGrafico])

  useEffect(() => {
    document.title = 'Datademy - Datos Globales'
    return () => { document.title = 'Datademy' }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Top bar */}
      <div
        className="w-full py-3 px-6 flex items-center gap-4"
        style={{ background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})` }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="text-white/80 hover:text-white text-md transition-colors flex items-center gap-1"
        >
          ← Volver
        </button>
        <h1 className="text-white font-semibold text-md">Datos globales</h1>

        {respuesta?.agrupado_por && (
          <span className="text-sm text-white/80 bg-white/15 px-2.5 py-1 rounded-full">
            Agrupado por {respuesta.agrupado_por}
          </span>
        )}

        {/* Toggle tipo */}
        <div className="ml-auto flex items-center bg-white/20 rounded-xl p-0.5">
          {(['estudiantes', 'socios'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTipo(t); setRespuesta(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize
                ${tipo === t ? 'bg-white' : 'text-white/80'}`}
              style={tipo === t ? { color: tema.sidebar } : undefined}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex h-[calc(100vh-48px)]">
        <div className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Selecciona procesos a comparar
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {cargandoFormularios ? (
              <p className="text-sm text-slate-400 text-center py-8 animate-pulse">Cargando...</p>
            ) : formularios.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No hay procesos disponibles</p>
            ) : (
              formularios.map(f => (
                <label
                  key={f.idProceso}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={seleccionados.has(f.idProceso)}
                    onChange={() => toggleSeleccionado(f.idProceso)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: tema.sidebar }}
                  />
                  <div>
                    <p className="text-md font-medium text-slate-700 dark:text-slate-200">
                      {f.nombreProceso}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">{f.anio}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleComparar}
              disabled={seleccionados.size === 0 || cargando}
              className="w-full py-2.5 rounded-xl text-white text-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})` }}
            >
              {cargando ? 'Comparando...' : 'Comparar'}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!comparativa.length && !cargando && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-slate-400 dark:text-slate-500 text-md mb-1">
                Selecciona procesos y haz clic en Comparar
              </p>
              <p className="text-slate-300 dark:text-slate-600 text-sm">
                Los gráficos aparecerán aquí
              </p>
            </div>
          )}

          {cargando && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 animate-pulse text-md">Cargando comparativa...</p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-md text-center">{error}</p>
          )}

          {comparativa.length > 0 && !cargando && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {comparativa.map((proceso, i) => {
                  const nps = proceso.metricas.nps_satisfaccion
                  return (
                    <div
                      key={proceso.id_proceso}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORES_PROCESO[i % COLORES_PROCESO.length] }}
                        />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                          {proceso.nombre_proceso}
                        </p>
                      </div>

                      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {proceso.metricas.promedio_satisfaccion_general.toFixed(1)}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5">satisfacción general</p>
                      {proceso.variacion_satisfaccion_respecto_anterior !== null && (
                        <p
                          className={`text-sm mt-1 font-medium ${
                            proceso.variacion_satisfaccion_respecto_anterior >= 0 ? 'text-green-500' : 'text-red-400'
                          }`}
                        >
                          {proceso.variacion_satisfaccion_respecto_anterior >= 0 ? '↑' : '↓'}{' '}
                          {Math.abs(proceso.variacion_satisfaccion_respecto_anterior).toFixed(2)} vs anterior
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-sm text-slate-400">Encuestados</p>
                          <p className="text-md font-semibold text-slate-700 dark:text-slate-200">
                            {proceso.metricas.total_encuestados}
                            {proceso.metricas.total_esperados > 0 && (
                              <span className="text-sm font-normal text-slate-400">
                                {' '}/ {proceso.metricas.total_esperados}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Tasa respuesta</p>
                          <p className="text-md font-semibold text-slate-700 dark:text-slate-200">
                            {proceso.metricas.tasa_respuesta_porcentaje > 0
                              ? `${proceso.metricas.tasa_respuesta_porcentaje.toFixed(0)}%`
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {nps && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm text-slate-400">NPS</p>
                            <span
                              className="text-md font-bold"
                              title={interpretarNps(nps.score_nps).texto}
                              style={{ color: interpretarNps(nps.score_nps).color }}
                            >
                              {nps.score_nps}
                            </span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                            <div
                              className="h-full"
                              style={{ width: `${nps.distribucion_porcentajes.promotores_pct}%`, backgroundColor: '#22c55e' }}
                              title={`Promotores: ${nps.cantidades_reales.promotores}`}
                            />
                            <div
                              className="h-full"
                              style={{ width: `${nps.distribucion_porcentajes.pasivos_pct}%`, backgroundColor: '#eab308' }}
                              title={`Pasivos: ${nps.cantidades_reales.pasivos}`}
                            />
                            <div
                              className="h-full"
                              style={{ width: `${nps.distribucion_porcentajes.detractores_pct}%`, backgroundColor: '#ef4444' }}
                              title={`Detractores: ${nps.cantidades_reales.detractores}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {datosGrafico && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">
                    Comparativa por constructo
                  </h3>
                  <div style={{ height: `${Math.max(300, datosGrafico.labels.length * 60)}px` }}>
                    <Bar
                      data={datosGrafico}
                      options={{
                        indexAxis: 'y',
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            min: 0,
                            max: maxEscalaGrafico,
                            ticks: { color: colorTexto },
                            grid: { color: colorGrid },
                          },
                          y: {
                            ticks: { color: colorTexto },
                            grid: { color: colorGrid },
                          },
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: { color: colorTexto, font: { size: 11 }, boxWidth: 12 },
                          },
                          tooltip: {
                            callbacks: {
                              label: ctx => `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(2)}`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {comparativa.some(p => p.variaciones_constructos.some(v => v.variacion_respecto_anterior !== null)) && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">
                    Variaciones respecto al proceso anterior
                  </h3>
                  <div className="space-y-3">
                    {comparativa
                      .filter(p => p.variaciones_constructos.some(v => v.variacion_respecto_anterior !== null))
                      .map((proceso, i) => (
                        <div key={proceso.id_proceso}>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: COLORES_PROCESO[i % COLORES_PROCESO.length] }}
                            />
                            {proceso.nombre_proceso}
                          </p>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {proceso.variaciones_constructos
                              .filter(v => v.variacion_respecto_anterior !== null)
                              .map(v => (
                                <div
                                  key={v.nombre_constructo}
                                  className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-3 py-2 flex items-center justify-between gap-2"
                                >
                                  <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
                                    {v.nombre_constructo}
                                  </span>
                                  <span
                                    className={`text-sm font-bold flex-shrink-0 ${
                                      v.variacion_respecto_anterior! >= 0 ? 'text-green-500' : 'text-red-400'
                                    }`}
                                  >
                                    {v.variacion_respecto_anterior! >= 0 ? '↑' : '↓'}{' '}
                                    {Math.abs(v.variacion_respecto_anterior!).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {alfasNormalizadas.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Fiabilidad entre procesos (alfa de Cronbach)
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
                    Comparación del alfa de Cronbach por constructo entre los procesos seleccionados.
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {alfasNormalizadas.map(item => (
                      <TarjetaComparativaConstructo
                        key={item.nombreConstructo}
                        item={item}
                        colorPorValor={valor => interpretarAlfa(valor).color}
                        formatearValor={valor => valor.toFixed(2)}
                        maxEscala={1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {promediosNormalizados.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Promedios entre procesos
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
                    Promedio general por constructo entre los procesos seleccionados.
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {promediosNormalizados.map(item => (
                      <TarjetaComparativaConstructo
                        key={item.nombreConstructo}
                        item={item}
                        colorPorValor={() => tema.sidebar}
                        formatearValor={valor => valor.toFixed(2)}
                        maxEscala={4}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ThemeToggle />
    </div>
  )
}
