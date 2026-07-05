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
import { useProceso } from '../../context/ProcesoContext'
import { useFiltrosDisponibles } from '../../hooks/useFiltrosDisponibles'
import { obtenerComparativaInterna } from '../../services/estadisticos_service'
import type { ComparativaResponse, AgrupacionInterna } from '../../services/estadisticos_service'
import { useTheme } from '../../context/ThemeContext'
import { temasPagina, temaDefault } from '../../utils/temasPagina'
import ThemeToggle from '../../components/ThemeToggle'
import TarjetaComparativaConstructo from '../../components/TarjetaComparativaConstructo'
import {
  COLORES_PROCESO,
  interpretarAlfa,
  interpretarNps,
  normalizarAlfas,
  normalizarPromedios,
} from '../../utils/comparativas'
import iconoVolver from '../../assets/HOME.png'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const AGRUPACIONES: { valor: AgrupacionInterna; etiqueta: string }[] = [
  { valor: 'carrera', etiqueta: 'Carrera' },
  { valor: 'sede', etiqueta: 'Sede' },
  { valor: 'asignatura', etiqueta: 'Asignatura' },
  { valor: 'nivel_formativo', etiqueta: 'Nivel formativo' },
]

export default function ComparativaInterna() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { idProceso } = useProceso()
  const tema = temasPagina['/comparativa-interna'] ?? temaDefault

  const { filtros: filtrosDisponibles, cargando: cargandoFiltros } = useFiltrosDisponibles(idProceso, 'estudiantes')

  const [agruparPor, setAgruparPor] = useState<AgrupacionInterna>('carrera')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  const [filtroCarrera, setFiltroCarrera] = useState('')
  const [filtroSede, setFiltroSede] = useState('')
  const [filtroAsignatura, setFiltroAsignatura] = useState('')
  const [filtroNivelFormativo, setFiltroNivelFormativo] = useState('')
  const [filtroGenero, setFiltroGenero] = useState('')

  const [respuesta, setRespuesta] = useState<ComparativaResponse | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colorTexto = theme === 'dark' ? 'white' : '#334155'
  const colorGrid = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

  // Al cambiar de agrupación, la selección y los resultados anteriores dejan de
  // tener sentido, y el filtro que coincide con la nueva agrupación se limpia
  // (queda deshabilitado, no tiene caso mantenerle un valor cargado).
  useEffect(() => {
    setSeleccionados(new Set())
    setRespuesta(null)
    setError(null)
    if (agruparPor === 'carrera') setFiltroCarrera('')
    if (agruparPor === 'sede') setFiltroSede('')
    if (agruparPor === 'asignatura') setFiltroAsignatura('')
    if (agruparPor === 'nivel_formativo') setFiltroNivelFormativo('')
  }, [agruparPor])

  const valoresDisponibles = useMemo(() => {
    switch (agruparPor) {
      case 'carrera': return filtrosDisponibles?.carreras ?? []
      case 'sede': return filtrosDisponibles?.sedes ?? []
      case 'asignatura': return filtrosDisponibles?.asignaturas ?? []
      case 'nivel_formativo': return filtrosDisponibles?.niveles_formativos ?? []
      default: return []
    }
  }, [agruparPor, filtrosDisponibles])

  const toggleSeleccionado = (valor: string) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(valor)) nuevo.delete(valor)
      else nuevo.add(valor)
      return nuevo
    })
  }

  const handleComparar = async () => {
    if (!idProceso || seleccionados.size === 0) return
    setCargando(true)
    setError(null)
    try {
      const data = await obtenerComparativaInterna(idProceso, agruparPor, [...seleccionados], {
        carrera: agruparPor !== 'carrera' ? (filtroCarrera || undefined) : undefined,
        sede: agruparPor !== 'sede' ? (filtroSede || undefined) : undefined,
        asignatura: agruparPor !== 'asignatura' ? (filtroAsignatura || undefined) : undefined,
        nivel_formativo: agruparPor !== 'nivel_formativo' ? (filtroNivelFormativo || undefined) : undefined,
        genero: filtroGenero || undefined,
      })
      setRespuesta(data)
    } catch {
      setError('No se pudo obtener la comparativa')
    } finally {
      setCargando(false)
    }
  }

  const comparativa = respuesta?.comparativa_global ?? []
  const comparativaAlfas = respuesta?.comparativa_alfas ?? []
  const comparativaPromedios = respuesta?.comparativa_promedios ?? []
  const escalaLikert = comparativa[0]?.metricas.escala_maxima_likert ?? 4
  const alfasNormalizadas = useMemo(() => normalizarAlfas(comparativaAlfas), [comparativaAlfas])
  const promediosNormalizados = useMemo(() => normalizarPromedios(comparativaPromedios), [comparativaPromedios])

  const datosGrafico = useMemo(() => {
    if (comparativa.length === 0) return null

    const constructosSet = new Set<string>()
    comparativa.forEach(g =>
      g.metricas.promedios_por_pagina.forEach(c => constructosSet.add(c.nombre_constructo))
    )
    const constructos = [...constructosSet]

    return {
      labels: constructos,
      datasets: comparativa.map((grupo, i) => ({
        label: grupo.nombre_proceso,
        data: constructos.map(nombre => {
          const c = grupo.metricas.promedios_por_pagina.find(p => p.nombre_constructo === nombre)
          return c?.promedio_constructo ?? 0
        }),
        backgroundColor: COLORES_PROCESO[i % COLORES_PROCESO.length] + 'cc',
        borderColor: COLORES_PROCESO[i % COLORES_PROCESO.length],
        borderWidth: 1,
        borderRadius: 4,
      })),
    }
  }, [comparativa])

  useEffect(() => {
    document.title = 'Datademy - Comparativa interna'
    return () => { document.title = 'Datademy' }
  }, [])

  if (!idProceso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-700 dark:text-slate-200 text-md mb-3">
            No hay proceso seleccionado.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-md text-blue-500 hover:text-blue-600 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  const selectClass =
    'rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800'

  const filtros: { clave: AgrupacionInterna | 'genero'; etiqueta: string; valor: string; onChange: (v: string) => void; opciones: string[] }[] = [
    { clave: 'carrera', etiqueta: 'Carrera', valor: filtroCarrera, onChange: setFiltroCarrera, opciones: filtrosDisponibles?.carreras ?? [] },
    { clave: 'sede', etiqueta: 'Sede', valor: filtroSede, onChange: setFiltroSede, opciones: filtrosDisponibles?.sedes ?? [] },
    { clave: 'asignatura', etiqueta: 'Asignatura', valor: filtroAsignatura, onChange: setFiltroAsignatura, opciones: filtrosDisponibles?.asignaturas ?? [] },
    { clave: 'nivel_formativo', etiqueta: 'Nivel formativo', valor: filtroNivelFormativo, onChange: setFiltroNivelFormativo, opciones: filtrosDisponibles?.niveles_formativos ?? [] },
    { clave: 'genero', etiqueta: 'Género', valor: filtroGenero, onChange: setFiltroGenero, opciones: filtrosDisponibles?.generos ?? [] },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div
        className="w-full py-3 px-6 flex flex-col gap-3"
        style={{ background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})` }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/detalles')}
            className="text-white/80 text-bold hover:text-white text-md flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <img src={iconoVolver} alt="Volver al dashboard" className="w-6 h-6 object-contain flex-shrink-0 brightness-0 invert" />
            Volver
          </button>
          <h1 className="text-white font-semibold text-md">Comparativa interna</h1>
          <span className="text-md font-medium text-white/80 bg-white/15 px-2.5 py-1 rounded-full">
            Agrupando por: {AGRUPACIONES.find(a => a.valor === agruparPor)?.etiqueta}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-white mr-1 font-semibold">Filtros:</span>
          {filtros.map(f => {
            const inutil = f.clave === agruparPor
            return (
              <select
                key={f.clave}
                value={f.valor}
                disabled={inutil || cargandoFiltros}
                onChange={e => f.onChange(e.target.value)}
                title={inutil ? `No aplica: ya estás agrupando por ${f.etiqueta}` : undefined}
                className={selectClass}
              >
                <option value="">{f.etiqueta}: todos</option>
                {f.opciones.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )
          })}
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        <div className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
              Agrupar por
            </label>
            <select
              value={agruparPor}
              onChange={e => setAgruparPor(e.target.value as AgrupacionInterna)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {AGRUPACIONES.map(a => (
                <option key={a.valor} value={a.valor}>{a.etiqueta}</option>
              ))}
            </select>
            <p className="text-sm text-slate-400 dark:text-slate-200 mt-2">
              {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {cargandoFiltros ? (
              <p className="text-sm text-slate-400 text-center py-8 animate-pulse">Cargando opciones...</p>
            ) : valoresDisponibles.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8 px-4">
                No hay valores de {AGRUPACIONES.find(a => a.valor === agruparPor)?.etiqueta.toLowerCase()} disponibles para este proceso.
              </p>
            ) : (
              valoresDisponibles.map(valor => (
                <label
                  key={valor}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={seleccionados.has(valor)}
                    onChange={() => toggleSeleccionado(valor)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: tema.sidebar }}
                  />
                  <p className="text-md font-medium text-slate-700 dark:text-slate-200">{valor}</p>
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
              <p className="text-slate-700 dark:text-slate-200 text-md mb-1">
                Elige una agrupación, selecciona valores a comparar y presiona Comparar
              </p>
              <p className="text-slate-300 dark:text-slate-600 text-sm">
                Los gráficos aparecerán aquí
              </p>
            </div>
          )}

          {cargando && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-700 animate-pulse text-md">Cargando comparativa...</p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-md text-center">{error}</p>
          )}

          {comparativa.length > 0 && !cargando && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {comparativa.map((grupo, i) => {
                  const nps = grupo.metricas.nps_satisfaccion
                  return (
                    <div
                      key={grupo.id_proceso}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORES_PROCESO[i % COLORES_PROCESO.length] }}
                        />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                          {grupo.nombre_proceso}
                        </p>
                      </div>

                      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {grupo.metricas.promedio_satisfaccion_general.toFixed(1)}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">satisfacción general</p>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-200">Encuestados</p>
                          <p className="text-md font-semibold text-slate-700 dark:text-slate-200">
                            {grupo.metricas.total_encuestados}
                            {grupo.metricas.total_esperados > 0 && (
                              <span className="text-sm font-normal text-slate-700 dark:text-slate-200">
                                {' '}/ {grupo.metricas.total_esperados}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-200">Tasa respuesta</p>
                          <p className="text-md font-semibold text-slate-700 dark:text-slate-200">
                            {grupo.metricas.tasa_respuesta_porcentaje > 0
                              ? `${grupo.metricas.tasa_respuesta_porcentaje.toFixed(0)}%`
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {nps && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm text-slate-700 dark:text-slate-200">NPS</p>
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
                            max: escalaLikert,
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

              {alfasNormalizadas.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Fiabilidad entre grupos (alfa de Cronbach)
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-4">
                    Comparación del alfa de Cronbach por constructo entre los valores de {AGRUPACIONES.find(a => a.valor === agruparPor)?.etiqueta.toLowerCase()} seleccionados.
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
                    Promedios entre grupos
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-4">
                    Promedio general por constructo entre los valores de {AGRUPACIONES.find(a => a.valor === agruparPor)?.etiqueta.toLowerCase()} seleccionados.
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {promediosNormalizados.map(item => (
                      <TarjetaComparativaConstructo
                        key={item.nombreConstructo}
                        item={item}
                        colorPorValor={() => tema.colorInforme}
                        formatearValor={valor => valor.toFixed(2)}
                        maxEscala={escalaLikert}
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
