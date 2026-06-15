import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

interface PickerOptions {
  onSeleccionada: (id: string, nombre?: string) => void
  modo?: 'carpeta' | 'formulario' | 'documento'
}

export function useGooglePicker({ onSeleccionada, modo = 'carpeta' }: PickerOptions) {
  const { gToken } = useAuth()
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  const [scriptCargado, setScriptCargado] = useState(false)


  const abrirPickerDirecto = () => {
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
        .setOAuthToken(gToken!) 
        .setDeveloperKey(apiKey)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            console.log('Picker data:', data)
            const doc = data.docs[0]
            onSeleccionada(doc.id, doc.name)
          }
        })
        .build()

      picker.setVisible(true)
    } catch (err) {
      console.error('Error en Picker:', err)
    }
  }

  useEffect(() => {
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
      window.gapi.load('picker', () => {
        setScriptCargado(true)
      })
    }

    if (window.gapi) {
      inicializarPicker()
    } else {
      script.addEventListener('load', inicializarPicker)
    }

    return () => {
    }
  }, [])

  const abrirPicker = () => {
    if (!gToken) {
      return console.error('No hay gToken disponible')
    }

    if (window.gapi && window.google?.picker) {
      abrirPickerDirecto()
      return
    }

    const existingScript = document.getElementById('google-picker-script')
    if (existingScript) {
      window.gapi.load('picker', abrirPickerDirecto)
      return
    }

    const script = document.createElement('script')
    script.id = 'google-picker-script'
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => window.gapi.load('picker', abrirPickerDirecto)
    document.head.appendChild(script)
  }

  return { 
    abrirPicker, 
    isReady: scriptCargado && !!gToken 
  }
}