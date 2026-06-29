import { getGoogleToken } from '../services/googleToken'
import { useEffect, useState, useCallback } from 'react'

interface PickerOptions {
  onSeleccionada: (id: string, nombre?: string) => void
  modo?: 'carpeta' | 'formulario' | 'documento'
}

export function useGooglePicker({ onSeleccionada, modo = 'carpeta' }: PickerOptions) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  const [scriptCargado, setScriptCargado] = useState(false)

  useEffect(() => {
    let activo = true

    if (window.gapi && window.google?.picker) {
      setScriptCargado(true)
      return
    }

    let script = document.getElementById('google-picker-script') as HTMLScriptElement

    if (!script) {
      script = document.createElement('script')
      script.id = 'google-picker-script'
      script.src = 'https://apis.google.com/js/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    const inicializarPicker = () => {
      if (window.gapi) {
        window.gapi.load('picker', () => {
          if (activo) {
            setScriptCargado(true)
          }
        })
      }
    }

    if (window.gapi) {
      inicializarPicker()
    } else {
      script.addEventListener('load', inicializarPicker)
    }

    return () => {
      activo = false
    }
  }, [])

  const abrirPickerDirecto = useCallback((tokenActual: string) => {
    try {
      let view

      if (modo === 'formulario') {
        view = new window.google.picker.DocsView()
          .setMimeTypes('application/vnd.google-apps.form')
          .setIncludeFolders(false)
      } else if (modo === 'documento') {
        view = new window.google.picker.DocsView()
          .setMimeTypes('application/vnd.google-apps.document')
          .setIncludeFolders(false)
      } else {
        view = new window.google.picker.DocsView()
          .setIncludeFolders(true)
          .setSelectFolderEnabled(true)
          .setMimeTypes('application/vnd.google-apps.folder')
      }

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(tokenActual) 
        .setDeveloperKey(apiKey)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0]
            onSeleccionada(doc.id, doc.name)
          }
        })
        .build()

      picker.setVisible(true)
    } catch (err) {
      console.error('Error interno al inicializar Google Picker:', err)
    }
  }, [modo, apiKey, onSeleccionada])

  const abrirPicker = useCallback(() => {
    const tokenActual = getGoogleToken()
    
    if (!tokenActual) {
      console.error('No hay token de Google disponible en memoria')
      return
    }

    if (window.gapi && window.google?.picker) {
      abrirPickerDirecto(tokenActual)
      return
    }

    if (document.getElementById('google-picker-script')) {
      window.gapi.load('picker', () => abrirPickerDirecto(tokenActual))
      return
    }
  }, [abrirPickerDirecto])

  return {
    abrirPicker,
    isReady: scriptCargado && !!getGoogleToken()
  }
}