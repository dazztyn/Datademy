import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../../components/ThemeToggle'
import logoA from '../../assets/LOGOA+S.png'
import logoDIDEC from '../../assets/LOGODIDEC.png'
import Google from '../../assets/GOOGLEICON.svg'

const MENSAJES_CONOCIDOS: Record<string, string> = {
  acceso_denegado: 'No tiene acceso a Datademy. Por favor, contacte al profesor/administrador para habilitar una cuenta.',
}

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setErrorAcceso(MENSAJES_CONOCIDOS[error] ?? error)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleLogin = () => {
    setErrorAcceso(null)
    window.location.href = import.meta.env.VITE_API_URL + '/auth/google'
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #1b4f96, #7f458f)' }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm mx-4 px-8 py-10 flex flex-col items-center">

        <div className="flex items-center justify-between w-full mb-8">
          <img
            src={logoA}
            alt="Logo A+S"
            className="h-12 w-20 object-contain"
          />
          <img
            src={logoDIDEC}
            alt="Logo DIDEC"
            className="h-12 w-20 object-contain"
          />
        </div>

        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Iniciar sesión
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          Usa tu cuenta institucional de Google
        </p>

        {errorAcceso && (
          <div className="w-full mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5">
              No autorizado
            </p>
            <p className="text-xs text-red-500 dark:text-red-400/80 leading-relaxed">
              {errorAcceso}
            </p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-150 shadow-sm flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(to right, #1b4f96, #7f458f)' }}
        >
          <img
            src={Google}
            alt="Google"
            className="w-5 h-5 bg-white rounded-full p-0.5"
          />
          Continuar con Google
        </button>
      </div>

      <ThemeToggle />
    </div>
  )
}