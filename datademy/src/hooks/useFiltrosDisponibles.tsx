import { useEffect, useState } from 'react'
import type { FiltrosDisponibles } from '../services/estadisticos_service'
import { obtenerFiltrosDisponibles } from '../services/estadisticos_service'

export function useFiltrosDisponibles(idProceso: string | null, tipo: 'estudiantes' | 'socios') {
  const [filtros, setFiltros] = useState<FiltrosDisponibles>({})
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!idProceso) return
    setFiltros({}) 
    setCargando(true)
    obtenerFiltrosDisponibles(idProceso, tipo)
      .then(setFiltros)
      .catch(() => setFiltros({}))
      .finally(() => setCargando(false))
  }, [idProceso, tipo])

  return { filtros, cargando }
}