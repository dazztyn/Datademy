import { test, expect } from './fixtures'
import { mockSesionActiva, mockSesionInexistente } from './fixtures'

// El botón "Continuar con Google" hace window.location.href al backend real
// (${VITE_API_URL}/auth/google), lo que en producción termina en el OAuth
// real de Google. No podemos ni debemos probar el OAuth de Google acá:
// interceptamos esa navegación y la mockeamos como si el backend ya hubiese
// completado el login y nos redirigiera de vuelta a la SPA.

test.describe('Login con Google', () => {
  test('sin sesión, se muestra la pantalla de login', async ({ page }) => {
    await mockSesionInexistente(page)
    await page.goto('/login')

    await expect(page.getByRole('button', { name: /continuar con google/i })).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('login exitoso redirige al dashboard', async ({ page }) => {
    // Simula que el backend completó el OAuth y redirige a /dashboard.
    await page.route('**/auth/google', route =>
      route.fulfill({ status: 302, headers: { Location: '/dashboard' } })
    )
    await mockSesionActiva(page)
    await page.route('**/formularios/listar', route =>
      route.fulfill({ json: { procesos: [] } })
    )

    await page.goto('/login')
    await page.getByRole('button', { name: /continuar con google/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText('Procesos disponibles')).toBeVisible()
  })

  test('un usuario ya autenticado que visita /login es redirigido al dashboard', async ({ page }) => {
    await mockSesionActiva(page)
    await page.route('**/formularios/listar', route =>
      route.fulfill({ json: { procesos: [] } })
    )

    await page.goto('/login')

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('muestra el mensaje de acceso denegado cuando el backend redirige con ?error', async ({ page }) => {
    await mockSesionInexistente(page)
    await page.goto('/login?error=acceso_denegado')

    await expect(page.getByText(/no tiene acceso a datademy/i)).toBeVisible()
    // El query param se limpia después de leerlo
    await expect(page).toHaveURL(/\/login$/)
  })
})
