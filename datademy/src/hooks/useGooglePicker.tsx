import { useAuth } from '../context/AuthContext'

interface PickerOptions {
  onSeleccionada: (idCarpeta: string) => void
}

export function useGooglePicker({ onSeleccionada }: PickerOptions) {
  const { gToken } = useAuth()
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY

  const abrirPicker = () => {
    if (!gToken) return console.error('No hay gToken disponible')

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      window.gapi.load('picker', () => {
        const picker = new window.google.picker.PickerBuilder()
          .addView(
            new window.google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true)
              .setMimeTypes('application/vnd.google-apps.folder')
          )
          .setOAuthToken(gToken)
          .setDeveloperKey(apiKey)
          .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const carpeta = data.docs[0]
              onSeleccionada(carpeta.id)
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