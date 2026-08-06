import { createContext, useContext, useState, useRef, useEffect } from 'react'

type EstadoJob = 'idle' | 'procesando' | 'completado' | 'error'

interface InformeContextType {
  estadoJob: EstadoJob
  urlInforme: string | null
  escucharEstadoJob: (jobId: string) => void
  resetear: () => void
}

const InformeContext = createContext<InformeContextType | undefined>(undefined)
const BASE_URL = import.meta.env.VITE_API_URL
const MAX_ESPERA_MS = 2 * 60 * 1000

export function InformeProvider({ children }: { children: React.ReactNode }) {
  const [estadoJob, setEstadoJob] = useState<EstadoJob>('idle')
  const [urlInforme, setUrlInforme] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cerrarConexion = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => cerrarConexion()
  }, [])

  const escucharEstadoJob = (jobId: string) => {
    cerrarConexion()
    setEstadoJob('procesando')

    const es = new EventSource(`${BASE_URL}/reportes/estado/${jobId}`, {
      withCredentials: true,
    })
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const response = await fetch(`${BASE_URL}/reportes/estado/${jobId}?t=${Date.now()}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (!response.ok) throw new Error()
        const data = await response.json()

        if (data.estado === 'completado') {
          clearInterval(intervaloRef.current!)
          intervaloRef.current = null
          setEstadoJob('completado')
          setUrlInforme(data.resultado.url_informe)
        } else if (data.estado === 'error') {
          clearInterval(intervaloRef.current!)
          intervaloRef.current = null
          setEstadoJob('error')
        }
      } catch {
        clearInterval(intervaloRef.current!)
        intervaloRef.current = null
        setEstadoJob('error')
        cerrarConexion()
      }
    }

    es.onerror = () => {
      setEstadoJob('error')
      cerrarConexion()
    }

    maxTimeoutRef.current = setTimeout(() => {
      setEstadoJob('error')
      cerrarConexion()
    }, MAX_ESPERA_MS)
  }

  const resetear = () => {
    cerrarConexion()
    setEstadoJob('idle')
    setUrlInforme(null)
  }

  return (
    <InformeContext.Provider value={{ estadoJob, urlInforme, escucharEstadoJob, resetear }}>
      {children}
    </InformeContext.Provider>
  )
}

export function useInforme() {
  const context = useContext(InformeContext)
  if (!context) throw new Error('useInforme debe usarse dentro de InformeProvider')
  return context
}