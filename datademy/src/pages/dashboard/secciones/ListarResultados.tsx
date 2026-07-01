import { useState, useEffect } from 'react'
import { useProceso } from '../../../context/ProcesoContext'
import { useResultados } from '../../../hooks/useResultados'
import type { FiltrosResultados, Respuesta } from '../../../services/estadisticos_service'
import ModalRespuestas from '../../../components/ModalRespuestas'
import { useFiltrosDisponibles } from '../../../hooks/useFiltrosDisponibles'


const CAMPOS_FIJOS = ['id_respuesta', 'fecha', 'edad', 'genero', 'nivel_formativo', 'sede', 'carrera', 'nombre', 'organizacion', 'asignatura']

export default function ListarResultados() {
  const { idProceso } = useProceso()
  const [tipoActivo, setTipoActivo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const [filtros, setFiltros] = useState<FiltrosResultados>({ tipo: 'estudiantes' })
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<Respuesta | null>(null)
  const { resultados, cargando, error } = useResultados(idProceso, filtros)
  const { filtros: filtrosDisponibles } = useFiltrosDisponibles(idProceso, tipoActivo)

  useEffect(() => {
  document.title = 'Datademy - Lista Resultados'
  return () => { document.title = 'Datademy' }
}, []) 
  useEffect(() => {
    setFiltros({ tipo: tipoActivo })
  }, [tipoActivo])

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-md">No hay proceso seleccionado. Vuelve al inicio y selecciona uno.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center bg-white/20 dark:bg-slate-900/40 rounded-xl p-1">
        {(['estudiantes', 'socios'] as const).map(tipo => (
          <button
            key={tipo}
            onClick={() => { setTipoActivo(tipo) }}
            className={`flex-1 py-2 rounded-lg text-md font-medium transition-all duration-200 capitalize
              ${tipoActivo === tipo
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-purple-800 dark:text-slate-50'
              }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg ml-1 font-medium text-slate-600 dark:text-slate-300 mb-3">Filtros</h3>
  {(() => {
  const selectClass = "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-blue-400"
  
  const fd = {
    carreras: filtrosDisponibles.carreras ?? [],
    sedes: filtrosDisponibles.sedes ?? [],
    generos: filtrosDisponibles.generos ?? [],
    niveles_formativos: filtrosDisponibles.niveles_formativos ?? [],
    asignaturas: filtrosDisponibles.asignaturas ?? [],
    organizaciones: filtrosDisponibles.organizaciones ?? [],
  }

  const filtrosActivos = [
    tipoActivo === 'estudiantes' && fd.carreras.length > 0 && (
      <div key="carrera">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50 block">Carrera</label>
        <select onChange={e => setFiltros(f => ({ ...f, carrera: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todas</option>
          {fd.carreras.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'estudiantes' && fd.sedes.length > 0 && (
      <div key="sede">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50 block">Sede</label>
        <select onChange={e => setFiltros(f => ({ ...f, sede: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todas</option>
          {fd.sedes.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'estudiantes' && fd.generos.length > 0 && (
      <div key="genero_est">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50 block">Género</label>
        <select onChange={e => setFiltros(f => ({ ...f, genero: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todos</option>
          {fd.generos.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'estudiantes' && fd.niveles_formativos.length > 0 && (
      <div key="nivel">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50 block">Nivel formativo</label>
        <select onChange={e => setFiltros(f => ({ ...f, nivel_formativo: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todos</option>
          {fd.niveles_formativos.map(n => <option key={n}>{n}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'estudiantes' && fd.asignaturas.length > 0 && (
      <div key="asignatura_est">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50  block">Asignatura</label>
        <select onChange={e => setFiltros(f => ({ ...f, asignatura: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todas</option>
          {fd.asignaturas.map(n => <option key={n}>{n}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'socios' && fd.organizaciones.length > 0 && (
      <div key="organizacion">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50  block">Organización</label>
        <select onChange={e => setFiltros(f => ({ ...f, organizacion: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todas</option>
          {fd.organizaciones.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'socios' && fd.generos.length > 0 && (
      <div key="genero_socios">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50 block">Género</label>
        <select onChange={e => setFiltros(f => ({ ...f, genero: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todos</option>
          {fd.generos.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'socios' && fd.carreras.length > 0 && (
      <div key="asignatura_socios">
        <label className="text-md ml-1 text-slate-600 mb-1 dark:text-slate-50  block">Asignatura</label>
        <select onChange={e => setFiltros(f => ({ ...f, asignatura: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todas</option>
          {fd.carreras.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    ),
    tipoActivo === 'socios' && fd.asignaturas.length > 0 && (
      <div key="nivel_socios">
        <label className="text-md ml-1 text-slate-600 dark:text-slate-50 mb-1 block">Nivel formativo</label>
        <select onChange={e => setFiltros(f => ({ ...f, nivel_formativo: e.target.value || undefined }))} className={selectClass}>
          <option value="">Todos</option>
          {fd.asignaturas.map(n => <option key={n}>{n}</option>)}
        </select>
      </div>
    ),
  ].filter(Boolean)

  return (
    <div className="grid grid-cols-2 gap-3">
      {filtrosActivos.map((filtro, i) => (
        <div
          key={i}
          className={filtrosActivos.length % 2 !== 0 && i === filtrosActivos.length - 1 ? 'col-span-2' : ''}
        >
          {filtro}
        </div>
      ))}
    </div>
  )
})()}
</div>

      {cargando && <p className="text-center text-white/70 text-md py-8 animate-pulse">Cargando resultados...</p>}
      {error && <p className="text-center text-red-300 text-md py-8">{error}</p>}

      {resultados && !cargando && (
        <>
          <p className="text-md text-purple-800 dark:text-purple-50 font-medium ml-1">
            {resultados.total_respuestas} respuesta{resultados.total_respuestas !== 1 ? 's' : ''}
          </p>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-md">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {(tipoActivo === 'estudiantes'
                      ? ['Edad', 'Género', 'Nivel formativo', 'Sede', 'Carrera', '']
                      : ['Nombre', 'Organización', 'Edad', 'Género', '']
                    ).map(col => (
                      <th key={col} className="text-left px-4 py-3 text-md font-medium text-slate-600 dark:text-slate-500">
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
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r['nombre'] ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r['organizacion'] ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.edad}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.genero}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setRespuestaSeleccionada(r)}
                          className="text-md text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors whitespace-nowrap"
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