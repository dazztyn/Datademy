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
  }, [tipo, onCerrar])

const estilos = {
    exito: 'bg-emerald-500 border-emerald-600',
    error: 'bg-rose-500 border-rose-600',
    cargando: 'bg-blue-500 border-blue-600',
  }

 const iconos = {
    exito: <span className="w-5 h-5 flex items-center justify-center font-bold text-base">✓</span>,
    error: <span className="w-5 h-5 flex items-center justify-center font-bold text-base">✕</span>,
    cargando: (
  <div className="flex gap-1 items-center">
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
    <div
      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
      style={{ animationDelay: '0.15s' }}
    ></div>
    <div
      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
      style={{ animationDelay: '0.3s' }}
    ></div>
  </div>
),
  }

  return (
    <div 
      className={`fixed bottom-16 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-900/10 border text-white text-sm font-medium transition-all duration-300 animate-fade-in-up ${estilos[tipo]}`}
    >
      <div className="flex-shrink-0">
        {iconos[tipo]}
      </div>
      
      <span className="leading-tight">{mensaje}</span>
      
      {tipo !== 'cargando' && (
        <button 
          onClick={onCerrar} 
          className="ml-3 text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors text-xs font-bold"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      )}
    </div>
  )
}