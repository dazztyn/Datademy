import { createContext, useContext, useState, useEffect } from 'react'

interface ProcesoContextType {
  idProceso: string | null
  setIdProceso: (id: string) => void
  metadatosCompletos: boolean
  setMetadatosCompletos: (v: boolean) => void
  verificandoMetadatos: boolean
}
const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  const jwt = sessionStorage.getItem('jwt')
  return {
    'Content-Type': 'application/json',
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  }
}
const ProcesoContext = createContext<ProcesoContextType | undefined>(undefined)

export function ProcesoProvider({ children }: { children: React.ReactNode }) {
  const [idProceso, setIdProcesoState] = useState<string | null>(
    sessionStorage.getItem('idProceso')
  )
  const [metadatosCompletos, setMetadatosCompletosState] = useState<boolean>(false)
  const [verificandoMetadatos, setVerificandoMetadatos] = useState<boolean>(false)

  const verificarMetadatos = async (id: string) => {
    setVerificandoMetadatos(true)
    try {
      const response = await fetch(`${BASE_URL}/formularios/${id}/metadatos`, {
        headers: getHeaders(),
        credentials: 'include',
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setMetadatosCompletosState(data.estan_completos === true)
    } catch {
      setMetadatosCompletosState(false)
    } finally {
      setVerificandoMetadatos(false)
    }
  }
  useEffect(() => {
    if (idProceso) verificarMetadatos(idProceso)
    else setMetadatosCompletosState(false)
  }, [idProceso])

  const setIdProceso = (id: string) => {
    sessionStorage.setItem('idProceso', id)
    setIdProcesoState(id)
  }

  const setMetadatosCompletos = (v: boolean) => {
    setMetadatosCompletosState(v)
  }


 return (
    <ProcesoContext.Provider value={{
      idProceso,
      setIdProceso,
      metadatosCompletos,
      setMetadatosCompletos,
      verificandoMetadatos,
    }}>
      {children}
    </ProcesoContext.Provider>
  )
}

export function useProceso() {
  const context = useContext(ProcesoContext)
  if (!context) throw new Error('useProceso debe usarse dentro de ProcesoProvider')
  return context
}