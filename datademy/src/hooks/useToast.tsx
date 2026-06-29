import { useState, useCallback, useRef } from 'react'

interface ToastState {
  mensaje: string
  tipo: 'exito' | 'error' | 'cargando'
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const limpiarTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }
  const cerrar = useCallback(() => {
    limpiarTimer()
    setToast(null)
  }, [])

  const mostrar = useCallback((mensaje: string, tipo: 'exito' | 'error' | 'cargando') => {
    limpiarTimer()
    
    setToast({ mensaje, tipo })


    if (tipo !== 'cargando') {
      timerRef.current = setTimeout(() => {
        cerrar()
      }, 3000)
    }
  }, [cerrar])

  return { toast, mostrar, cerrar }
}