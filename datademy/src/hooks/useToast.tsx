import { useState } from 'react'

interface ToastState {
  mensaje: string
  tipo: 'exito' | 'error' | 'cargando'
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const mostrar = (mensaje: string, tipo: 'exito' | 'error' | 'cargando') => {
    setToast({ mensaje, tipo })
  }

  const cerrar = () => setToast(null)

  return { toast, mostrar, cerrar }
}