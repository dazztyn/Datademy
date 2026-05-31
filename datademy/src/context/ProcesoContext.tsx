import { createContext, useContext, useState } from 'react'

interface ProcesoContextType {
  idProceso: string | null
  setIdProceso: (id: string) => void
}

const ProcesoContext = createContext<ProcesoContextType | undefined>(undefined)

export function ProcesoProvider({ children }: { children: React.ReactNode }) {
  const [idProceso, setIdProcesoState] = useState<string | null>(
    sessionStorage.getItem('idProceso')
  )

  const setIdProceso = (id: string) => {
    sessionStorage.setItem('idProceso', id)
    setIdProcesoState(id)
  }

  return (
    <ProcesoContext.Provider value={{ idProceso, setIdProceso }}>
      {children}
    </ProcesoContext.Provider>
  )
}

export function useProceso() {
  const context = useContext(ProcesoContext)
  if (!context) throw new Error('useProceso debe usarse dentro de ProcesoProvider')
  return context
}