import { createContext, useContext, useState } from 'react'

interface AuthContextType {
  jwt: string | null
  gToken: string | null
  guardarTokens: (jwt: string, gToken: string) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(sessionStorage.getItem('jwt'))
  const [gToken, setGToken] = useState<string | null>(sessionStorage.getItem('gToken'))

  const guardarTokens = (jwt: string, gToken: string) => {
    sessionStorage.setItem('jwt', jwt)
    sessionStorage.setItem('gToken', gToken)
    setJwt(jwt)
    setGToken(gToken)
  }

  const cerrarSesion = () => {
    sessionStorage.removeItem('jwt')
    sessionStorage.removeItem('gToken')
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