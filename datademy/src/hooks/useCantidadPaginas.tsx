import { useEffect, useState } from 'react'
import type { CantidadPaginasResponse } from '../services/estadisticos_service'
import { obtenerCantidadPaginas } from '../services/estadisticos_service'

export function useCantidadPaginas(idProceso: string | null, tipo: 'estudiantes' | 'socios') {
  const [datosPaginas, setDatosPaginas] = useState<CantidadPaginasResponse | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!idProceso) return
    setCargando(true)
    obtenerCantidadPaginas(idProceso, tipo)
      .then(setDatosPaginas)
      .catch(() => setDatosPaginas(null))
      .finally(() => setCargando(false))
  }, [idProceso, tipo])

  return { datosPaginas, cargandoPaginas: cargando }
}