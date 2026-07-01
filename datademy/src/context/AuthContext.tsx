import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setGoogleToken, clearGoogleToken } from '../services/googleToken.ts'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const BASE_URL = import.meta.env.VITE_API_URL

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const limpiarAutenticacionLocal = useCallback(() => {
    setIsAuthenticated(false)
    clearGoogleToken()
  }, [])
  const cerrarSesion = useCallback(async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error cerrando sesión en el servidor:', error)
    } finally {
      limpiarAutenticacionLocal()
    }
  }, [limpiarAutenticacionLocal])

 useEffect(() => {
    let activo = true 

    const recuperarTokenDeGoogle = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/google-token`, {
          method: 'GET',
          credentials: 'include',
        })
        
        if (!activo) return

        if (response.ok) {
          const data = await response.json()
          if (data.estado === 'exito' && data.googleAccessToken) {
            setIsAuthenticated(true)
            setGoogleToken(data.googleAccessToken)
          } else {
            limpiarAutenticacionLocal()
          }
        } else {
          limpiarAutenticacionLocal()
        }
      } catch (error) {
        console.error('Error al recuperar el token de Google:', error)
        if (activo) {
          limpiarAutenticacionLocal()
        }
      } finally {
        if (activo) {
          setIsLoading(false)
        }
      }
    }

    recuperarTokenDeGoogle()

    return () => {
      activo = false 
    }
  }, [limpiarAutenticacionLocal])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}