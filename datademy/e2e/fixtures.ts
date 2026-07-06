import { test as base, expect, type Page } from '@playwright/test'

/**
 * Todos los mocks usan patrones glob (**\/ruta) en vez de la URL completa,
 * así no importa qué valga VITE_API_URL en cada entorno (local, CI, etc.).
 */

export interface UsuarioMock {
  userId: string
  correo: string
  rol: 'admin' | 'profesor'
}

const USUARIO_DEFAULT: UsuarioMock = {
  userId: 'user-1',
  correo: 'profesor@datademy.cl',
  rol: 'profesor',
}

/**
 * Simula que el usuario ya pasó por el login de Google: el AuthContext
 * hace polling a /auth/google-token al montar, así que basta con
 * responder eso + /auth/me para que isAuthenticated quede en true.
 */
export async function mockSesionActiva(page: Page, usuario: UsuarioMock = USUARIO_DEFAULT) {
  await page.route('**/auth/google-token', route =>
    route.fulfill({ json: { estado: 'exito', googleAccessToken: 'token-de-prueba' } })
  )
  await page.route('**/auth/me', route =>
    route.fulfill({ json: { estado: 'exito', usuario } })
  )
  await page.route('**/auth/logout', route =>
    route.fulfill({ json: { estado: 'exito' } })
  )
}

/** Simula que el AuthContext nunca encontró una sesión válida. */
export async function mockSesionInexistente(page: Page) {
  await page.route('**/auth/google-token', route =>
    route.fulfill({ status: 401, json: { estado: 'error' } })
  )
}

/**
 * Reemplaza por completo la API de Google Picker (window.gapi / window.google.picker)
 * para no depender del script real de Google. Al "abrir" el picker, el fake
 * PickerBuilder invoca el callback inmediatamente con un documento simulado,
 * como si el usuario hubiese seleccionado algo en Drive.
 */
export async function mockGooglePicker(
  page: Page,
  docSeleccionado: { id: string; name: string } = { id: 'archivo-mock-1', name: 'Archivo de prueba' }
) {
  // Evita que el navegador intente pegarle a la API real de Google.
  await page.route('https://apis.google.com/js/api.js', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '// google api stub' })
  )

  await page.addInitScript((doc) => {
    // @ts-expect-error - stub global, no existe tipado real acá
    window.gapi = { load: (_nombre: string, callback: () => void) => callback() }

    class DocsView {
      setMimeTypes() { return this }
      setIncludeFolders() { return this }
      setSelectFolderEnabled() { return this }
    }

    class PickerBuilder {
      private cb: (data: unknown) => void = () => {}
      addView() { return this }
      setOAuthToken() { return this }
      setDeveloperKey() { return this }
      setCallback(cb: (data: unknown) => void) { this.cb = cb; return this }
      build() {
        return {
          // El componente real llama picker.setVisible(true) para "abrirlo";
          // nosotros simulamos que el usuario elige `doc` al instante.
          setVisible: (visible: boolean) => {
            if (visible) this.cb({ action: 'picked', docs: [doc] })
          },
        }
      }
    }

    // @ts-expect-error - stub global
    window.google = { picker: { DocsView, PickerBuilder, Action: { PICKED: 'picked' } } }
  }, docSeleccionado)
}

export const test = base
export { expect }
