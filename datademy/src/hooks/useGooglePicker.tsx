import { useAuth } from '../context/AuthContext'

interface PickerOptions {
  onSeleccionada: (id: string, nombre?: string) => void
  modo?: 'carpeta' | 'formulario'
}

export function useGooglePicker({ onSeleccionada, modo = 'carpeta' }: PickerOptions) {
  const { gToken } = useAuth()
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY

  const abrirPicker = () => {
    if (!gToken) return console.error('No hay gToken disponible')

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      window.gapi.load('picker', () => {
        const view = modo === 'formulario'
          ? new window.google.picker.DocsView()
              .setMimeTypes('application/vnd.google-apps.form')
              .setIncludeFolders(false)
          : new window.google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true)
              .setMimeTypes('application/vnd.google-apps.folder')

        const picker = new window.google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(gToken)
          .setDeveloperKey(apiKey)
          .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0]
              onSeleccionada(doc.id, doc.name)
            }
          })
          .build()
        picker.setVisible(true)
      })
    }
    document.body.appendChild(script)
  }

  return { abrirPicker }
}