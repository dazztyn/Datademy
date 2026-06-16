import { createContext, useContext, useState, useRef } from 'react'

interface InformeContextType {
  estadoJob: 'idle' | 'procesando' | 'completado' | 'error'
  urlInforme: string | null
  iniciarPolling: (jobId: string) => void
  resetear: () => void
}

const InformeContext = createContext<InformeContextType | undefined>(undefined)

const BASE_URL = import.meta.env.VITE_API_URL

export function InformeProvider({ children }: { children: React.ReactNode }) {
  const [estadoJob, setEstadoJob] = useState<'idle' | 'procesando' | 'completado' | 'error'>('idle')
  const [urlInforme, setUrlInforme] = useState<string | null>(null)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const iniciarPolling = (jobId: string) => {
    if (intervaloRef.current) clearInterval(intervaloRef.current)

    setEstadoJob('procesando')

    intervaloRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${BASE_URL}/reportes/estado/${jobId}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (!response.ok) throw new Error()
        const data = await response.json()

        if (data.estado === 'completado') {
          clearInterval(intervaloRef.current!)
          setEstadoJob('completado')
          setUrlInforme(data.resultado.url_informe)
        } else if (data.estado === 'error') {
          clearInterval(intervaloRef.current!)
          setEstadoJob('error')
        }
      } catch {
        clearInterval(intervaloRef.current!)
        setEstadoJob('error')
      }
    }, 3000)
  }

  const resetear = () => {
    if (intervaloRef.current) clearInterval(intervaloRef.current)
    setEstadoJob('idle')
    setUrlInforme(null)
  }

  return (
    <InformeContext.Provider value={{ estadoJob, urlInforme, iniciarPolling, resetear }}>
      {children}
    </InformeContext.Provider>
  )
}

export function useInforme() {
  const context = useContext(InformeContext)
  if (!context) throw new Error('useInforme debe usarse dentro de InformeProvider')
  return context
}