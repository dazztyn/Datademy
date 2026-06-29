import { useEffect, useState } from 'react'
import type { ResultadosResponse, FiltrosResultados } from '../services/estadisticos_service'
import { obtenerResultados } from '../services/estadisticos_service'

export function useResultados(idProceso: string | null, filtros: FiltrosResultados) {
  const [resultados, setResultados] = useState<ResultadosResponse | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idProceso) return
    setCargando(true)
    setError(null)
    obtenerResultados(idProceso, filtros)
      .then(setResultados)
      .catch(() => setError('No se pudieron cargar los resultados'))
      .finally(() => setCargando(false))
  }, [idProceso, JSON.stringify(filtros)])

  return { resultados, cargando, error }
}