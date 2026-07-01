import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ModalConfirmar from './ModalConfirmar'

export default function CerrarSesionBtn() {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const [mostrarModal, setMostrarModal] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleCerrar = async () => {
    setCargando(true)

    try {
      await cerrarSesion()
      navigate('/login')
    } finally {
      setCargando(false)
      setMostrarModal(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        className="fixed hover:underline bottom-5 left-5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-4 py-2 text-xl text-red-400 hover:text-red-500 dark:text-red-400 hover:shadow-lg transition-all"
      >
        Cerrar sesión
      </button>

      {mostrarModal && (
        <ModalConfirmar
          mensaje="Se cerrará tu sesión actual."
          onConfirmar={handleCerrar}
          onCerrar={() => {
            if (!cargando) {
              setMostrarModal(false)
            }
          }}
          cargando={cargando}
        />
      )}
    </>
  )
}