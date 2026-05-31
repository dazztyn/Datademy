import { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import type { FiltrosMetricas } from '../../../services/estadisticos_service'

const COLORES_GENERO = ['#5fb7bb', '#0d438b', '#7f458f']

export default function Visualizar() {
  const { idProceso } = useProceso()
  const [filtros, setFiltros] = useState<FiltrosMetricas>({ tipo: 'estudiantes' })
  const [carreraInput, setCarreraInput] = useState('')
  const { metricas, cargando, error } = useMetricas(idProceso, filtros)

  const actualizarFiltro = (campo: keyof FiltrosMetricas, valor: any) => {
    setFiltros(prev => ({ ...prev, [campo]: valor || undefined }))
  }

  const datosGenero = metricas
    ? Object.entries(metricas.distribucion_genero).map(([name, value]) => ({ name, value }))
    : []

  const datosPreguntasTodas = metricas
    ? metricas.promedios_por_pagina.flatMap(p =>
        Object.entries(p.preguntas).map(([pregunta, promedio]) => ({
          pregunta: pregunta.length > 40 ? pregunta.slice(0, 40) + '...' : pregunta,
          promedio: Number(promedio.toFixed(2)),
          pagina: p.numero_pagina,
        }))
      )
    : []

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
            <select
              value={filtros.tipo ?? ''}
              onChange={e => actualizarFiltro('tipo', e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todos</option>
              <option value="estudiantes">Estudiantes</option>
              <option value="socios">Socios</option>
            </select>
          </div>
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
          {/* Tarjetas resumen */}
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

          {/* Gráfico de género */}
          {datosGenero.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                Distribución por género
              </h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={datosGenero}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {datosGenero.map((_, i) => (
                        <Cell key={i} fill={COLORES_GENERO[i % COLORES_GENERO.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {datosGenero.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORES_GENERO[i % COLORES_GENERO.length] }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {entry.name}: <strong>{entry.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de promedios por pregunta */}
          {datosPreguntasTodas.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                Promedios por pregunta
              </h3>
              <ResponsiveContainer width="100%" height={datosPreguntasTodas.length * 50 + 40}>
                <BarChart
                  data={datosPreguntasTodas}
                  layout="vertical"
                  margin={{ left: 20, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 7]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="pregunta"
                    width={220}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="promedio" fill="#5fb7bb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}