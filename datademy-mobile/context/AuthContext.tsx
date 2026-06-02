import { createContext, useContext, useState } from 'react'

interface AuthContextType {
  jwt: string | null
  gToken: string | null
  guardarTokens: (jwt: string, gToken: string) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Eliminamos sessionStorage porque rompe la app móvil
  const [jwt, setJwt] = useState<string | null>(null)
  const [gToken, setGToken] = useState<string | null>(null)

  const guardarTokens = (jwt: string, gToken: string) => {
    setJwt(jwt)
    setGToken(gToken)
  }

  const cerrarSesion = () => {
    setJwt(null)
    setGToken(null)
  }

  return (
    <AuthContext.Provider value={{ jwt, gToken, guardarTokens, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}