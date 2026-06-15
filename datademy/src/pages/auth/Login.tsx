import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../../components/ThemeToggle'

export default function Login() {
  const [searchParams] = useSearchParams()
  const { guardarTokens } = useAuth()
  const navigate = useNavigate()

useEffect(() => {
  const gToken = searchParams.get('gToken')
  if (gToken) {
    guardarTokens(gToken)
    navigate('/dashboard')
  }
}, [])

  const handleLogin = () => {
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
            src="/src/assets/LOGOA+S.png"
            alt="Logo A+S"
            className="h-12 w-20 object-contain"
          />
          <img
            src="/src/assets/LOGODIDEC.png"
            alt="Logo DIDEC"
            className="h-12 w-20 object-contain"
          />
        </div>

        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Iniciar sesión
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
          Usa tu cuenta institucional de Google
        </p>

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-150 shadow-sm flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(to right, #1b4f96, #7f458f)' }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
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