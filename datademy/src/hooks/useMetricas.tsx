import { useEffect, useState } from 'react'
import type { Metricas, FiltrosMetricas } from '../services/estadisticos_service'
import { obtenerMetricas } from '../services/estadisticos_service'

export function useMetricas(idProceso: string | null, filtros: FiltrosMetricas) {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idProceso) return
    setCargando(true)
    setError(null)
    obtenerMetricas(idProceso, filtros)
      .then(setMetricas)
      .catch(() => setError('No se pudieron cargar las métricas'))
      .finally(() => setCargando(false))
  }, [idProceso, JSON.stringify(filtros)])

  return { metricas, cargando, error }
}