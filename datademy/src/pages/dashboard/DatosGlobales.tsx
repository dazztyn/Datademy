import { useState, useMemo } from 'react'
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
import type { ComparativaGlobal } from '../../services/estadisticos_service'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ThemeToggle'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const COLORES_PROCESO = ['#5fb7bb', '#0d438b', '#7f458f', '#f59e0b', '#22c55e', '#ef4444']

export default function DatosGlobales() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { formularios, cargando: cargandoFormularios } = useFormularios()
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [tipo, setTipo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const [comparativa, setComparativa] = useState<ComparativaGlobal[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colorTexto = theme === 'dark' ? 'white' : '#334155'
  const colorGrid = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

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
      setComparativa(data.comparativa_global)
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Top bar */}
      <div
        className="w-full py-3 px-6 flex items-center gap-4"
        style={{ background: 'linear-gradient(to right, #22c55e, #059669)' }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="text-white/80 hover:text-white text-sm transition-colors flex items-center gap-1"
        >
          ← Volver
        </button>
        <h1 className="text-white font-semibold text-sm">Datos globales</h1>

        {/* Toggle tipo */}
        <div className="ml-auto flex items-center bg-white/20 rounded-xl p-0.5">
          {(['estudiantes', 'socios'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTipo(t); setComparativa([]) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
                ${tipo === t ? 'bg-white text-green-700' : 'text-white/80'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex h-[calc(100vh-48px)]">
        <div className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Selecciona procesos a comparar
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {cargandoFormularios ? (
              <p className="text-xs text-slate-400 text-center py-8 animate-pulse">Cargando...</p>
            ) : formularios.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No hay procesos disponibles</p>
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
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {f.nombreProceso}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{f.anio}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleComparar}
              disabled={seleccionados.size === 0 || cargando}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(to right, #22c55e, #059669)' }}
            >
              {cargando ? 'Comparando...' : 'Comparar'}
            </button>
          </div>
        </div>

        {/* Panel derecho — gráficos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!comparativa.length && !cargando && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-1">
                Selecciona procesos y haz clic en Comparar
              </p>
              <p className="text-slate-300 dark:text-slate-600 text-xs">
                Los gráficos aparecerán aquí
              </p>
            </div>
          )}

          {cargando && (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 animate-pulse text-sm">Cargando comparativa...</p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {comparativa.length > 0 && !cargando && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {comparativa.map((proceso, i) => (
                  <div
                    key={proceso.id_proceso}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORES_PROCESO[i % COLORES_PROCESO.length] }}
                      />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                        {proceso.nombre_proceso}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                      {proceso.metricas.promedio_satisfaccion_general.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">satisfacción general</p>
                    {proceso.variacion_satisfaccion_respecto_anterior !== null && (
                      <p className={`text-xs mt-1 font-medium ${proceso.variacion_satisfaccion_respecto_anterior >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {proceso.variacion_satisfaccion_respecto_anterior >= 0 ? '↑' : '↓'} {Math.abs(proceso.variacion_satisfaccion_respecto_anterior).toFixed(2)} vs anterior
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {proceso.metricas.total_encuestados} encuestados
                    </p>
                  </div>
                ))}
              </div>

              {datosGrafico && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
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

              {comparativa.some(p => p.variaciones_constructos.length > 0) && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                    Variaciones respecto al proceso anterior
                  </h3>
                  <div className="space-y-3">
                    {comparativa.filter(p => p.variaciones_constructos.length > 0).map((proceso, i) => (
                      <div key={proceso.id_proceso}>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: COLORES_PROCESO[i % COLORES_PROCESO.length] }}
                          />
                          {proceso.nombre_proceso}
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                          {proceso.variaciones_constructos.map(v => (
                            <div
                              key={v.nombre_constructo}
                              className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-3 py-2 flex items-center justify-between gap-2"
                            >
                              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                {v.nombre_constructo}
                              </span>
                              <span className={`text-xs font-bold flex-shrink-0 ${v.variacion_respecto_anterior >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                {v.variacion_respecto_anterior >= 0 ? '↑' : '↓'} {Math.abs(v.variacion_respecto_anterior).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
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