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

   useEffect(() => {
    if (window.gapi) {
      setScriptCargado(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.gapi.load('picker', () => {
        setScriptCargado(true)
      })
    }
    script.onerror = () => console.error('Error al cargar Google API Script')
    
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])
  const abrirPicker = () => {
    if (!gToken) {
      console.warn('Google Picker: Esperando a que gToken esté disponible en el contexto...')
      return
    }

    if (!window.google?.picker) {
      console.error('La librería Google Picker aún no se ha inicializado por completo.')
      return
    }

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
        .setOAuthToken(gToken) 
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

  return { 
    abrirPicker, 
    isReady: scriptCargado && !!gToken 
  }
}