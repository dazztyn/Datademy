import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ModalSesionExpirada() {
  const [mostrar, setMostrar] = useState(false)
  const navigate = useNavigate()
  const { cerrarSesion } = useAuth()

  useEffect(() => {
    const handler = () => setMostrar(true)
    window.addEventListener('google-session-expired', handler)
    return () => window.removeEventListener('google-session-expired', handler)
  }, [])

  const handleVolverAlLogin = async () => {
    setMostrar(false)
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  if (!mostrar) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-xl text-amber-600 dark:text-amber-400">⚠</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Tu sesión de Google expiró
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
          Por seguridad necesitamos que vuelvas a iniciar sesión para seguir usando Datademy.
        </p>
        <button
          onClick={handleVolverAlLogin}
          className="w-full py-2.5 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-95 transition-opacity bg-gradient-to-r from-blue-500 to-blue-700"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}