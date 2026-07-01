import { useState, useEffect, useRef } from 'react'

export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  const prevKeyRef = useRef(key)

   useEffect(() => {
    if (prevKeyRef.current === key) {
      sessionStorage.setItem(key, JSON.stringify(state))
      return
   }

   prevKeyRef.current = key
   try {
    const stored = sessionStorage.getItem(key)
    setState(stored ? JSON.parse(stored) : initialValue)
   } catch {
    setState(initialValue)
   }
  }, [key, state])

   return [state, setState] as const
 }
