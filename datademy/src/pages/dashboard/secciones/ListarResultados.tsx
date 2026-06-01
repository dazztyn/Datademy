import { useState, useEffect } from 'react'
import { useProceso } from '../../../context/ProcesoContext'
import { useResultados } from '../../../hooks/useResultados'
import type { FiltrosResultados, Respuesta } from '../../../services/estadisticos_service'
import ModalRespuestas from '../../../components/ModalRespuestas'

const CAMPOS_FIJOS = ['id_respuesta', 'fecha', 'edad', 'genero', 'nivel_formativo', 'sede', 'carrera', 'Nombre', 'Nombre de organización']

export default function ListarResultados() {
  const { idProceso } = useProceso()
  const [tipoActivo, setTipoActivo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const [filtros, setFiltros] = useState<FiltrosResultados>({ tipo: 'estudiantes' })
  const [carreraInput, setCarreraInput] = useState('')
  const [sedeInput, setSedeInput] = useState('')
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<Respuesta | null>(null)
  const { resultados, cargando, error } = useResultados(idProceso, filtros)

  useEffect(() => {
    setCarreraInput('')
    setSedeInput('')
    setFiltros({ tipo: tipoActivo })
  }, [tipoActivo])

  const camposFijos = (r: Respuesta) => ({
    edad: r.edad,
    genero: r.genero,
    nivel_formativo: r.nivel_formativo,
    sede: r.sede,
    carrera: r.carrera,
  })

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">No hay proceso seleccionado. Vuelve al inicio y selecciona uno.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center bg-white/20 dark:bg-slate-900/40 rounded-xl p-1">
        {(['estudiantes', 'socios'] as const).map(tipo => (
          <button
            key={tipo}
            onClick={() => { setTipoActivo(tipo) }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 capitalize
              ${tipoActivo === tipo
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-white/70 dark:text-slate-400'
              }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-3">
          {tipoActivo === 'estudiantes' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Carrera</label>
              <input
                type="text"
                value={carreraInput}
                onChange={e => setCarreraInput(e.target.value)}
                onBlur={() => setFiltros(f => ({ ...f, carrera: carreraInput || undefined }))}
                placeholder="Ej: ITI"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Sede</label>
            <select
              value={sedeInput}
              onChange={e => {
                setSedeInput(e.target.value)
                setFiltros(f => ({ ...f, sede: e.target.value || undefined }))
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todas</option>
              <option>Coquimbo</option>
              <option>Antofagasta</option>
            </select>
          </div>
        </div>
      </div>

      {cargando && <p className="text-center text-white/70 text-sm py-8 animate-pulse">Cargando resultados...</p>}
      {error && <p className="text-center text-red-300 text-sm py-8">{error}</p>}

      {resultados && !cargando && (
        <>
          <p className="text-xs text-white/70">
            {resultados.total_respuestas} respuesta{resultados.total_respuestas !== 1 ? 's' : ''}
          </p>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {(tipoActivo === 'estudiantes'
                      ? ['Edad', 'Género', 'Nivel formativo', 'Sede', 'Carrera', '']
                      : ['Nombre', 'Organización', 'Edad', 'Género', '']
                    ).map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {resultados.datos.map(r => (
                    <tr key={r.id_respuesta} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {tipoActivo === 'estudiantes' ? (
                        <>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.edad}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.genero}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.nivel_formativo ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.sede ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.carrera ?? '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r['Nombre'] ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r['Nombre de organización'] ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.edad}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.genero}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setRespuestaSeleccionada(r)}
                          className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors whitespace-nowrap"
                        >
                          Ver respuestas →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {respuestaSeleccionada && (
        <ModalRespuestas
          respuesta={Object.fromEntries(
            Object.entries(respuestaSeleccionada).filter(([k]) => !CAMPOS_FIJOS.includes(k))
          )}
          onCerrar={() => setRespuestaSeleccionada(null)}
        />
      )}
    </div>
  )
}