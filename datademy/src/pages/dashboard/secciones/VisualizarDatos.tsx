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
import type { FiltrosMetricas } from '../../../services/estadisticos_service'
import { useTheme } from '../../../context/ThemeContext'
import { temasPagina, temaDefault } from '../../../utils/temasPagina'
import { useLocation } from 'react-router-dom'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const COLORES = ['#5fb7bb', '#0d438b', '#7f458f']

export default function Visualizar() {
  const [tipoActivo, setTipoActivo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const { idProceso } = useProceso()
  const [filtros, setFiltros] = useState<FiltrosMetricas>({ tipo: 'estudiantes' })
  const [carreraInput, setCarreraInput] = useState('')
  const { metricas, cargando, error } = useMetricas(idProceso, filtros)
  const { theme } = useTheme()
  const location = useLocation()
  const tema = temasPagina[location.pathname] ?? temaDefault

  const colorTexto = theme === 'dark' ? 'white' : tema.sidebar
  const colorGrid = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  useEffect(() => {
  setCarreraInput('')
  setFiltros({ tipo: tipoActivo })
}, [tipoActivo])
  const actualizarFiltro = (campo: keyof FiltrosMetricas, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor || undefined }))
  }

  const datosGenero = metricas ? {
    labels: Object.keys(metricas.distribucion_genero),
    datasets: [{
      data: Object.values(metricas.distribucion_genero),
      backgroundColor: COLORES,
      borderWidth: 0,
    }]
  } : null

  const datosPreguntasTodas = metricas
    ? metricas.promedios_por_pagina.flatMap(p =>
        Object.entries(p.preguntas).map(([pregunta, promedio]) => ({
          pregunta: pregunta.length > 45 ? pregunta.slice(0, 45) + '...' : pregunta,
          promedio: Number(promedio.toFixed(2)),
        }))
      )
    : []

  const datosBarras = datosPreguntasTodas.length > 0 ? {
    labels: datosPreguntasTodas.map(d => d.pregunta),
    datasets: [{
      label: 'Promedio',
      data: datosPreguntasTodas.map(d => d.promedio),
      backgroundColor: tema.sidebar,
      borderRadius: 6,
    }]
  } : null

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">No hay proceso seleccionado. Vuelve al inicio y selecciona uno.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Filtros</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 mb-4">
                <button
                  onClick={() => {
                    setTipoActivo('estudiantes')
                    actualizarFiltro('tipo', 'estudiantes')
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200
                    ${tipoActivo === 'estudiantes'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                  Estudiantes
                </button>
                <button
                  onClick={() => {
                    setTipoActivo('socios')
                    actualizarFiltro('tipo', 'socios')
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200
                    ${tipoActivo === 'socios'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                  Socios
                </button>
              </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tipoActivo === 'estudiantes' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Carrera</label>
                <input
                  type="text"
                  value={carreraInput}
                  onChange={e => setCarreraInput(e.target.value)}
                  onBlur={() => actualizarFiltro('carrera', carreraInput)}
                  placeholder="Ej: ITI"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
            {tipoActivo === 'socios' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Organización</label>
                <input
                  type="text"
                  value={carreraInput}
                  onChange={e => setCarreraInput(e.target.value)}
                  onBlur={() => actualizarFiltro('carrera', carreraInput)}
                  placeholder="Ej: ONG Ejemplo"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Página del formulario</label>
              <input
                type="number"
                min={1}
                value={filtros.pagina ?? ''}
                onChange={e => actualizarFiltro('pagina', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Ej: 2"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Página del formulario</label>
            <input
              type="number"
              min={1}
              value={filtros.pagina ?? ''}
              onChange={e => actualizarFiltro('pagina', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Ej: 2"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      {cargando && (
        <p className="text-center text-white/70 text-sm py-8 animate-pulse">Cargando métricas...</p>
      )}
      {error && (
        <p className="text-center text-red-300 text-sm py-8">{error}</p>
      )}

      {metricas && !cargando && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Total encuestados</p>
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                {metricas.total_encuestados}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Satisfacción general</p>
              <p className="text-4xl font-bold" style={{ color: '#5fb7bb' }}>
                {metricas.promedio_satisfaccion_general.toFixed(1)}
              </p>
              <p className="text-xs text-slate-400 mt-1">sobre 7.0</p>
            </div>
          </div>


          {datosGenero && Object.keys(metricas.distribucion_genero).length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                Distribución por género
              </h3>
              <div className="flex items-center justify-center">
                <div className="w-48 h-48">
                  <Pie
                    key={`pie-${theme}`}
                    data={datosGenero}
                    options={{
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { color: colorTexto },
                        },
                        tooltip: {
                          backgroundColor: theme === 'dark' ? tema.sidebar : 'white',
                          titleColor: theme === 'dark' ? 'white' : tema.sidebar,
                          bodyColor: theme === 'dark' ? 'white' : tema.sidebar,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {datosBarras && datosPreguntasTodas.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                Promedios por pregunta
              </h3>
              <Bar
                key={`bar-${theme}`}
                data={datosBarras}
                options={{
                  indexAxis: 'y',
                  scales: {
                    x: {
                      min: 0,
                      max: 7,
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
                      backgroundColor: theme === 'dark' ? tema.sidebar : 'white',
                      titleColor: theme === 'dark' ? 'white' : tema.sidebar,
                      bodyColor: theme === 'dark' ? 'white' : tema.sidebar,
                    },
                  },
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}