import { useState, useEffect } from 'react'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import { configurarMetadatos } from '../../../services/formularios_service'
import { useToast } from '../../../hooks/useToast'
import Toast from '../../../components/Toast'

export default function CompletarDatos() {
  const { idProceso } = useProceso()
  const [tipoActivo, setTipoActivo] = useState<'estudiantes' | 'socios'>('estudiantes')
  const { metricas } = useMetricas(idProceso, { tipo: tipoActivo })
  const { toast, mostrar, cerrar } = useToast()

  const [totalEsperados, setTotalEsperados] = useState('')
  const [nombresConstructos, setNombresConstructos] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!metricas) return
    const numConstructos = metricas.promedios_por_pagina.length
    setNombresConstructos(prev => {
      if (prev.length === numConstructos) return prev
      return Array.from({ length: numConstructos }, (_, i) => prev[i] ?? '')
    })
  }, [metricas])

  const handleGuardar = async () => {
    if (!idProceso) return
    if (!totalEsperados || isNaN(Number(totalEsperados))) {
      return mostrar('Ingresa un número válido de participantes esperados', 'error')
    }
    if (nombresConstructos.some(n => !n.trim())) {
      return mostrar('Todos los constructos deben tener nombre', 'error')
    }
    setGuardando(true)
    mostrar('Guardando metadatos...', 'cargando')
    try {
      await configurarMetadatos(idProceso, tipoActivo, nombresConstructos, Number(totalEsperados))
      mostrar('Metadatos guardados correctamente', 'exito')
    } catch {
      mostrar('Error al guardar, intenta de nuevo', 'error')
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

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center bg-white/20 dark:bg-slate-900/40 rounded-xl p-1">
        {(['estudiantes', 'socios'] as const).map(tipo => (
          <button
            key={tipo}
            onClick={() => setTipoActivo(tipo)}
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

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
            Total de participantes esperados
          </label>
          <input
            type="number"
            min={1}
            value={totalEsperados}
            onChange={e => setTotalEsperados(e.target.value)}
            placeholder="Ej: 45"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {nombresConstructos.length > 0 && (
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">
              Nombre de cada constructo
            </label>
            <div className="flex flex-col gap-2">
              {nombresConstructos.map((nombre, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500 w-24 flex-shrink-0">
                    Constructo {i + 1}
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => {
                      const nuevos = [...nombresConstructos]
                      nuevos[i] = e.target.value
                      setNombresConstructos(nuevos)
                    }}
                    placeholder={`Ej: Metodología A+S`}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!metricas && (
          <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
            Cargando estructura del formulario...
          </p>
        )}

        <button
          onClick={handleGuardar}
          disabled={guardando || !metricas}
          className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
        >
          {guardando ? 'Guardando...' : 'Guardar metadatos'}
        </button>
      </div>

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}