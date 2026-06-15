import { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  gToken: string | null
  guardarTokens: (gToken: string) => void 
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const BASE_URL = import.meta.env.VITE_API_URL

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [gToken, setGToken] = useState<string | null>(null)

  useEffect(() => {
    const verificarSesionBackend = async () => {
      const savedGToken = sessionStorage.getItem('gToken')
      
      try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          setIsAuthenticated(true)
          setGToken(savedGToken)
        } else {
          cerrarSesion()
        }
      } catch (error) {
        console.error('Error verificando sesión con el servidor:', error)
        cerrarSesion()
      } finally {
        setIsLoading(false)
      }
    }

    verificarSesionBackend()
  }, [])

  const guardarTokens = (gToken: string) => {
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
    <AuthContext.Provider value={{ isAuthenticated, isLoading, gToken, guardarTokens, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}