import { test, expect } from './fixtures'
import { mockSesionActiva, mockGooglePicker } from './fixtures'
import type { Page } from '@playwright/test'

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

// Métricas mínimas pero válidas: dejamos vacíos los arrays de detalle/gráficos
// para no depender de que Chart.js renderice canvas en headless — lo que nos
// importa acá es el flujo, no la fidelidad visual de los gráficos.
function metricasMock(totalEncuestados: number) {
  return {
    total_esperados: 50,
    total_encuestados: totalEncuestados,
    tasa_respuesta_porcentaje: 80,
    distribucion_genero: [],
    promedios_por_pagina: [],
    promedio_satisfaccion_general: 4.2,
    promedio_satisfaccion_constructos: 4.2,
    escala_maxima_satisfaccion: 5,
    escala_maxima_likert: 5,
    porcentaje_volveria_participar: 90,
    detalle_por_dimension: [],
    ranking_preguntas: { top_3: [], bottom_3: [] },
    nps_satisfaccion: {
      score_nps: 50,
      distribucion_porcentajes: { promotores_pct: 60, pasivos_pct: 20, detractores_pct: 20 },
      cantidades_reales: { promotores: 30, pasivos: 10, detractores: 10, total: 50 },
    },
    fiabilidad_constructos: [],
    satisfaccion_por_carrera: [],
    satisfaccion_por_sede: [],
    satisfaccion_por_organizacion: [],
    tabla_socios_comunitarios: [],
  }
}

/** Registra todos los mocks de backend que se necesitan para todo el recorrido. */
async function mockBackendCompleto(page: Page) {
  await mockSesionActiva(page)

  await page.route('**/formularios/listar', route =>
    route.fulfill({ json: { procesos: [PROCESO_MOCK] } })
  )

  // Metadatos: al principio no están completos (CompletarDatos parte vacío).
  await page.route(`**/formularios/${ID_PROCESO}/metadatos`, route =>
    route.fulfill({ json: { estan_completos: false, metadatos: {} } })
  )

  // Estructura del formulario: 2 constructos para estudiantes, 1 para socios.
  await page.route(`**/formularios/${ID_PROCESO}/cantidad-constructos?tipo=estudiantes`, route =>
    route.fulfill({ json: { estado: 'ok', cantidad_paginas_total: 4, cantidad_constructos: 2 } })
  )
  await page.route(`**/formularios/${ID_PROCESO}/cantidad-constructos?tipo=socios`, route =>
    route.fulfill({ json: { estado: 'ok', cantidad_paginas_total: 3, cantidad_constructos: 1 } })
  )

  await page.route(`**/formularios/${ID_PROCESO}/configurar-metadatos`, route =>
    route.fulfill({ json: { estado: 'ok' } })
  )

  await page.route(`**/estadisticas/${ID_PROCESO}/metricas**`, route =>
    route.fulfill({ json: { status: 'ok', metricas: metricasMock(35) } })
  )

  await page.route(`**/estadisticas/${ID_PROCESO}/filtros-disponibles**`, route =>
    route.fulfill({
      json: { filtros_disponibles: { carreras: [], sedes: ['Coquimbo'], niveles_formativos: ['Pregrado'], asignaturas: [] } },
    })
  )

  await page.route('**/reportes/configurar', route =>
    route.fulfill({ json: { estado: 'ok' } })
  )

  await page.route(`**/reportes/${ID_PROCESO}/generar`, route =>
    route.fulfill({ json: { jobId: 'job-123' } })
  )

  // El polling de InformeContext pregunta cada 3s; devolvemos "completado" directo.
  await page.route('**/reportes/estado/job-123**', route =>
    route.fulfill({
      json: { estado: 'completado', resultado: { url_informe: 'https://docs.google.com/document/d/informe-mock' } },
    })
  )
}

test('seleccionar proceso → completar metadatos → generar informe → popup de éxito', async ({ page }) => {
  await mockBackendCompleto(page)
  await mockGooglePicker(page)

  // --- 1. Seleccionar proceso en el dashboard ---
  await page.goto('/dashboard')
  await page.getByText('Encuesta Docente 2025').click()
  await page.getByRole('button', { name: /ver detalles.*generar informes/i }).click()

  await expect(page).toHaveURL(/\/detalles\/completar/)

  // --- 2. Completar metadatos ---
  await page.getByPlaceholder('Ej: 45').fill('40')
  const constructosEstudiantes = page.getByPlaceholder('Ej: Compromiso')
  await expect(constructosEstudiantes).toHaveCount(2)
  await constructosEstudiantes.nth(0).fill('Compromiso docente')
  await constructosEstudiantes.nth(1).fill('Claridad de contenidos')

  await page.getByPlaceholder('Ej: 15').fill('10')
  const constructosSocios = page.getByPlaceholder('Ej: Impacto Comunitario')
  await expect(constructosSocios).toHaveCount(1)
  await constructosSocios.nth(0).fill('Impacto en la comunidad')

  await page.getByRole('button', { name: /^guardar todo$/i }).click()
  await expect(page.getByText('Todos los metadatos se guardaron correctamente')).toBeVisible()

  // --- 3. Ir a generar informe (el sidebar se desbloquea tras guardar metadatos) ---
  await page.getByText('Generar informe').click()
  await expect(page).toHaveURL(/\/detalles\/informe/)

  await page.getByRole('button', { name: /carpeta destino/i }).click()
  await expect(page.getByText('Carpeta destino configurada')).toBeVisible()

  await page.getByRole('button', { name: /plantilla del informe/i }).click()
  await expect(page.getByText('Plantilla configurada correctamente')).toBeVisible()

  // El toggle "Ingresar manualmente" de Carrera es el único que se muestra
  // siempre (el de Asignatura solo aparece si hay asignaturas cargadas).
  await page.getByRole('button', { name: 'Ingresar manualmente' }).click()
  await page.getByPlaceholder('Ej: Ingeniería Civil').fill('Enfermería')
  // Los <select> no tienen label asociado por htmlFor; identificamos cada uno
  // por una opción que solo existe en ese combo.
  await page.locator('select').filter({ hasText: 'Pregrado' }).selectOption('Pregrado')
  await page.locator('select').filter({ hasText: 'Coquimbo' }).selectOption('Coquimbo')
  await page.getByPlaceholder('Ej: 5').fill('4')
  await page.getByPlaceholder('Ej: Dr. Juan Pérez').fill('Prof. Ana Soto')
  await page.getByPlaceholder('Ej: María González').fill('Ana Soto')

  // --- 4. Generar informe y confirmar el popup de éxito ---
  await page.getByRole('button', { name: /^generar informe$/i }).click()

  await expect(page.getByText('¡Informe generado con éxito!')).toBeVisible()
  await expect(page.getByRole('link', { name: /ver informe/i })).toHaveAttribute(
    'href',
    'https://docs.google.com/document/d/informe-mock'
  )
})
