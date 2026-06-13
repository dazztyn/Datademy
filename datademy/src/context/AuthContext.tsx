import { createContext, useContext, useState } from 'react'

interface AuthContextType {
  isAuthenticated: boolean 
  gToken: string | null    
  guardarTokens: (jwt: string, gToken: string) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('isLoggedIn') === 'true'
  )
  const [gToken, setGToken] = useState<string | null>(sessionStorage.getItem('gToken'))

  const guardarTokens = (_jwt: string, gToken: string) => {
    sessionStorage.setItem('isLoggedIn', 'true')
    sessionStorage.setItem('gToken', gToken)
    setIsAuthenticated(true)
    setGToken(gToken)
  }

const cerrarSesion = () => {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('gToken')
    setIsAuthenticated(false)
    setGToken(null)
  }
  
return (
    <AuthContext.Provider value={{ isAuthenticated, gToken, guardarTokens, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}