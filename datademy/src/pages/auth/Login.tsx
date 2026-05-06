import { useState } from 'react'
import ThemeToggle from '../../components/ThemeToggle'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')

  const handleLogin = () => {
    // esperando a la wa
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

        <div className="flex flex-col gap-4 w-full mb-6">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
          </div>
        </div>
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-150 shadow-sm"
          style={{ background: 'linear-gradient(to right, #1b4f96, #7f458f)' }}
        >
          Iniciar sesión
        </button>
      </div>
      <ThemeToggle />
    </div>
  )
}