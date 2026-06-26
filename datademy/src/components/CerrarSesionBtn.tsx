import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function CerrarSesionBtn() {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const handleCerrar = () => {
    cerrarSesion()
    navigate('/login')
    // pendiente: llamar endpoint de logout del backend
  }

  return (
    <button
      onClick={handleCerrar}
      className="fixed bottom-5 left-5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-4 py-2 text-sm text-red-400 hover:text-red-500 dark:text-red-400 hover:shadow-lg transition-all"
    >
      Cerrar sesión
    </button>
  )
}