import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { obtenerCantidadPaginas } from '../services/estadisticos_service'
interface ProcesoContextType {
  idProceso: string | null
  setIdProceso: (id: string) => void
  metadatosCompletos: boolean
  setMetadatosCompletos: (v: boolean) => void
  verificandoMetadatos: boolean
  verificarMetadatos: (id: string) => Promise<void>
}
const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}
const ProcesoContext = createContext<ProcesoContextType | undefined>(undefined)

export function ProcesoProvider({ children }: { children: React.ReactNode }) {
  const [idProceso, setIdProcesoState] = useState<string | null>(
    sessionStorage.getItem('idProceso')
  )
  const [metadatosCompletos, setMetadatosCompletosState] = useState<boolean>(false)
  const [verificandoMetadatos, setVerificandoMetadatos] = useState<boolean>(false)
  const idProcesoRef = useRef<string | null>(null)

  const constructosCoinciden = (
    meta: { nombres_constructos: string[] } | undefined,
    paginas: { cantidad_constructos: number } | null
  ): boolean => {
    if (!meta) return false
    if (!paginas) return true
    return meta.nombres_constructos.length === paginas.cantidad_constructos
  }
  const verificarMetadatos = async (id: string) => {
    idProcesoRef.current = id
    setVerificandoMetadatos(true)
    try {
      const [response, paginasEst, paginasSoc] = await Promise.all([
        fetch(`${BASE_URL}/formularios/${id}/metadatos`, {
          headers: getHeaders(),
          credentials: 'include',
        }),
       obtenerCantidadPaginas(id, 'estudiantes').catch(() => null),
        obtenerCantidadPaginas(id, 'socios').catch(() => null),
      ])
      if (!response.ok) throw new Error()
      const data = await response.json()
      if (idProcesoRef.current !== id) return
      const estOk = constructosCoinciden(data.metadatos?.estudiantes, paginasEst)
      const socOk = constructosCoinciden(data.metadatos?.socios, paginasSoc)
      setMetadatosCompletosState(data.estan_completos === true && estOk && socOk)
    } catch {
      if (idProcesoRef.current === id) setMetadatosCompletosState(false)
    } finally {
      if (idProcesoRef.current === id) setVerificandoMetadatos(false)
    }
  }
  useEffect(() => {
    setMetadatosCompletosState(false) 
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
      verificarMetadatos,
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