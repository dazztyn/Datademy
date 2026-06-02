import { useEffect, useState } from 'react'
import type { Proceso } from '../types/formulario'
import { listarFormularios } from '../services/formularios_service'

export function useFormularios() {
  const [formularios, setFormularios] = useState<Proceso[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = () => {
    setCargando(true)
    setError(null)
    listarFormularios()
      .then(setFormularios)
      .catch(() => setError('No se pudieron cargar los formularios'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  return { formularios, cargando, error, recargar: cargar }
}