import { useEffect } from 'react'

interface ToastProps {
  mensaje: string
  tipo: 'exito' | 'error' | 'cargando'
  onCerrar: () => void
}

export default function Toast({ mensaje, tipo, onCerrar }: ToastProps) {
  useEffect(() => {
    if (tipo === 'cargando') return
    const timer = setTimeout(onCerrar, 3000)
    return () => clearTimeout(timer)
  }, [tipo])

  const estilos = {
    exito: 'bg-green-500',
    error: 'bg-red-500',
    cargando: 'bg-blue-500',
  }

  const iconos = {
    exito: <span>✓</span>,
    error: <span>✕</span>,
    cargando: (
      <img
        src="/src/assets/CLOCK.png"
        alt="Cargando"
        className="w-5 h-5 object-contain spin-pause"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    ),
  }

  return (
    <div className={`fixed bottom-16 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium transition-all duration-300 ${estilos[tipo]}`}>
      {iconos[tipo]}
      <span>{mensaje}</span>
      {tipo !== 'cargando' && (
        <button onClick={onCerrar} className="ml-2 text-white/70 hover:text-white transition-colors">
          ✕
        </button>
      )}
    </div>
  )
}