import { useState, useEffect } from 'react'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import { configurarMetadatos } from '../../../services/formularios_service'
import { useToast } from '../../../hooks/useToast'
import Toast from '../../../components/Toast'
import { usePersistedState } from '../../../hooks/usePersistentState'

export default function CompletarDatos() {
  const { idProceso } = useProceso()
  const { toast, mostrar, cerrar } = useToast()
  const [guardando, setGuardando] = useState(false)
  const { setMetadatosCompletos } = useProceso()

  const { metricas: metricasEstudiantes } = useMetricas(idProceso, { tipo: 'estudiantes' })
  const { metricas: metricasSocios } = useMetricas(idProceso, { tipo: 'socios' })

  const [totalEstudiantes, setTotalEstudiantes] = usePersistedState(`completar_totalEstudiantes_${idProceso}`, '')
  const [constructosEstudiantes, setConstructosEstudiantes] = usePersistedState<string[]>(`completar_constructos_estudiantes_${idProceso}`, [])
  const [totalSocios, setTotalSocios] = usePersistedState(`completar_totalSocios_${idProceso}`, '')
  const [constructosSocios, setConstructosSocios] = usePersistedState<string[]>(`completar_constructos_socios_${idProceso}`, [])
  useEffect(() => {
    document.title = 'Datademy - Completar Datos'
    return () => { document.title = 'Datademy' }
  }, []) 
  useEffect(() => {
  if (!idProceso) return
  fetch(`${import.meta.env.VITE_API_URL}/formularios/${idProceso}/metadatos`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
    .then(r => r.json())
    .then(data => {
      if (data.estan_completos) {
        const est = data.metadatos?.estudiantes
        const soc = data.metadatos?.socios
        if (est) {
          setTotalEstudiantes(String(est.total_esperados))
          setConstructosEstudiantes(est.nombres_constructos)
        }
        if (soc) {
          setTotalSocios(String(soc.total_esperados))
          setConstructosSocios(soc.nombres_constructos)
        }
      }
    })
    .catch(() => {})
}, [idProceso])
  useEffect(() => {
    if (!metricasEstudiantes) return
    const num = metricasEstudiantes.promedios_por_pagina.length
    setConstructosEstudiantes(prev => {
      if (prev.length === num) return prev
      return Array.from({ length: num }, (_, i) => prev[i] ?? '')
    })
  }, [metricasEstudiantes])

  useEffect(() => {
    if (!metricasSocios) return
    const num = metricasSocios.promedios_por_pagina.length
    setConstructosSocios(prev => {
      if (prev.length === num) return prev
      return Array.from({ length: num }, (_, i) => prev[i] ?? '')
    })
  }, [metricasSocios])

  const handleGuardar = async () => {
    if (!idProceso) return

    if (!totalEstudiantes || isNaN(Number(totalEstudiantes))) {
      return mostrar('Ingresa un número válido de estudiantes esperados', 'error')
    }
    if (constructosEstudiantes.some(n => !n.trim())) {
      return mostrar('Todos los constructos de estudiantes deben tener nombre', 'error')
    }

    if (!totalSocios || isNaN(Number(totalSocios))) {
      return mostrar('Ingresa un número válido de socios esperados', 'error')
    }
    if (constructosSocios.some(n => !n.trim())) {
      return mostrar('Todos los constructos de socios deben tener nombre', 'error')
    }

    setGuardando(true)
    mostrar('Guardando metadatos...', 'cargando')
    
    try {
      await Promise.all([
        configurarMetadatos(idProceso, 'estudiantes', constructosEstudiantes, Number(totalEstudiantes)),
        configurarMetadatos(idProceso, 'socios', constructosSocios, Number(totalSocios))
      ])
      setMetadatosCompletos(true)
      mostrar('Todos los metadatos se guardaron correctamente', 'exito')
    } catch {
      mostrar('Error al guardar los datos, intenta de nuevo', 'error')
    } finally {
      setGuardando(false)
    }
  }
  
  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">No hay proceso seleccionado. Vuelve al inicio y selecciona uno.</p>
      </div>
    )
  }

  const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
  const labelClass = "text-xs text-slate-500 dark:text-slate-400 mb-1 block font-medium"
  const cardClass = "bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 flex flex-col h-full"
  
  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 capitalize">
            Datos Estudiantes
          </h3>
          
          <div>
            <label className={labelClass}>Total de estudiantes esperados</label>
            <input
              type="number"
              min={1}
              value={totalEstudiantes}
              onChange={e => setTotalEstudiantes(e.target.value)}
              placeholder="Ej: 45"
              className={inputClass}
            />
          </div>
          <div className="flex-grow flex flex-col">
            {constructosEstudiantes.length > 0 ? (
              <div className="space-y-2 w-full flex-grow flex flex-col">
                <label className={labelClass}>Nombre de cada constructo (Estudiantes)</label>
                
            
                <div className="flex flex-col gap-4 flex-grow justify-start py-1">
                  {constructosEstudiantes.map((nombre, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 w-20 flex-shrink-0">
                        Constructo {i + 1}
                      </span>
                      <input
                        type="text"
                        value={nombre}
                        onChange={e => {
                          const nuevos = [...constructosEstudiantes]
                          nuevos[i] = e.target.value
                          setConstructosEstudiantes(nuevos)
                        }}
                        placeholder="Ej: Compromiso"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : !metricasEstudiantes && (
              <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                Cargando estructura de estudiantes...
              </p>
            )}
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 capitalize">
            Datos Socios Comunitarios
          </h3>
          
          <div>
            <label className={labelClass}>Total de socios esperados</label>
            <input
              type="number"
              min={1}
              value={totalSocios}
              onChange={e => setTotalSocios(e.target.value)}
              placeholder="Ej: 15"
              className={inputClass}
            />
          </div>

          <div className="flex-grow flex flex-col">
            {constructosSocios.length > 0 ? (
              <div className="space-y-2 w-full flex-grow flex flex-col">
                <label className={labelClass}>Nombre de cada constructo (Socios)</label>
                <div className="flex flex-col gap-4 flex-grow justify-start py-1">
                  {constructosSocios.map((nombre, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 w-20 flex-shrink-0">
                        Constructo {i + 1}
                      </span>
                      <input
                        type="text"
                        value={nombre}
                        onChange={e => {
                          const nuevos = [...constructosSocios]
                          nuevos[i] = e.target.value
                          setConstructosSocios(nuevos)
                        }}
                        placeholder="Ej: Impacto Comunitario"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : !metricasSocios && (
              <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                Cargando estructura de socios...
              </p>
            )}
          </div>
        </div>

      </div>

      <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <button
          onClick={handleGuardar}
          disabled={guardando || !metricasEstudiantes || !metricasSocios}
          className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-md hover:opacity-95"
          style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
        >
          {guardando ? 'Guardando todo...' : 'Guardar todo'}
        </button>
      </div>

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}