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
  const recuperarTokenDeGoogle = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/google-token`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.estado === 'exito' && data.googleAccessToken) {
          sessionStorage.setItem('isLoggedIn', 'true')
          sessionStorage.setItem('gToken', data.googleAccessToken)
          
          setIsAuthenticated(true)
          setGToken(data.googleAccessToken) 
        } else {
          cerrarSesion()
        }
      } else {
        cerrarSesion()
      }
    } catch (error) {
      console.error('Error al recuperar el token de Google:', error)
      cerrarSesion()
    } finally {
      setIsLoading(false) 
    }
  }

  recuperarTokenDeGoogle()
}, [])

  const guardarTokens = (gToken: string) => {
    sessionStorage.setItem('isLoggedIn', 'true')
    sessionStorage.setItem('gToken', gToken)
    setIsAuthenticated(true)
    setGToken(gToken)
  }

  const cerrarSesion = async () => {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gToken}`,
      },
      credentials: 'include', 
    })
  } catch (error) {
    console.error('Error cerrando sesión:', error)
  } finally {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('gToken')

    setIsAuthenticated(false)
    setGToken(null)
  }
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