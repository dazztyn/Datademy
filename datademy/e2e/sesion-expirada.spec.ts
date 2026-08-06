import { test, expect } from './fixtures'
import { mockSesionActiva } from './fixtures'

const ID_PROCESO = 'proceso-1'

const PROCESO_MOCK = {
  idProceso: ID_PROCESO,
  nombreProceso: 'Encuesta Docente 2025',
  anio: '2025',
  formularios: {
    formulario_estudiantes: { id_carpeta_drive: 'f1', id_google_form: 'g1', nombre_formulario: 'Form estudiantes' },
    formulario_socios: { id_carpeta_drive: 'f2', id_google_form: 'g2', nombre_formulario: 'Form socios' },
  },
}

test('el popup de sesión expirada aparece cuando el backend responde 401', async ({ page }) => {
  await mockSesionActiva(page)
  await page.route('**/formularios/listar', route =>
    route.fulfill({ json: { procesos: [PROCESO_MOCK] } })
  )

  await page.goto('/dashboard')
  await page.getByText('Encuesta Docente 2025').click()

  // Cualquier llamada al backend (fuera de /auth/google-token y /auth/logout)
  // que responda 401 hace que interceptorSesion.tsx dispare
  // 'google-session-expired'. Usamos la llamada a metadatos que se dispara
  // al entrar a /detalles/completar para gatillarlo.
  await page.route(`**/formularios/${ID_PROCESO}/metadatos`, route =>
    route.fulfill({ status: 401, json: { estado: 'error' } })
  )

  await page.getByRole('button', { name: /ver detalles.*generar informes/i }).click()

  await expect(page.getByText('Tu sesión de Google expiró')).toBeVisible()

  // Al volver al login se cierra sesión contra el backend y se navega a /login.
  await page.getByRole('button', { name: /volver al inicio de sesión/i }).click()
  await expect(page).toHaveURL(/\/login/)
})
