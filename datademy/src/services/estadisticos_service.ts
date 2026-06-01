const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  const jwt = sessionStorage.getItem('jwt')
  return {
    'Content-Type': 'application/json',
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  }
}

export interface Metricas {
  total_encuestados: number
  distribucion_genero: Record<string, number>
  promedios_por_pagina: {
    numero_pagina: number
    preguntas: Record<string, number>
  }[]
  promedio_satisfaccion_general: number
}

export interface MetricasResponse {
  status: string
  metricas: Metricas
}

export interface FiltrosMetricas {
  tipo?: 'estudiantes' | 'socios'
  carrera?: string
  pagina?: number
}

export async function obtenerMetricas(
  idProceso: string,
  filtros: FiltrosMetricas = {}
): Promise<Metricas> {
  const params = new URLSearchParams()
  if (filtros.tipo) params.append('tipo', filtros.tipo)
  if (filtros.carrera) params.append('carrera', filtros.carrera)
  if (filtros.pagina !== undefined) params.append('pagina', String(filtros.pagina))

  const url = `${BASE_URL}/estadisticas/${idProceso}/metricas?${params.toString()}`
  const response = await fetch(url, { headers: getHeaders() })
  if (!response.ok) throw new Error('Error al obtener métricas')
  const data: MetricasResponse = await response.json()
  return data.metricas
}
export async function sincronizarManual(idProceso: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/estadisticas/${idProceso}/sincronizar-manual`, {
    method: 'POST',
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Error al sincronizar')
}
export interface Respuesta {
  id_respuesta: string
  fecha: string
  edad: string
  genero: string
  nivel_formativo?: string
  sede?: string
  carrera?: string
  [key: string]: any
}

export interface ResultadosResponse {
  estado: string
  total_respuestas: number
  datos: Respuesta[]
}

export interface FiltrosResultados {
  tipo?: 'estudiantes' | 'socios'
  carrera?: string
  sede?: string
}

export async function obtenerResultados(
  idProceso: string,
  filtros: FiltrosResultados = {}
): Promise<ResultadosResponse> {
  const params = new URLSearchParams()
  if (filtros.tipo) params.append('tipo', filtros.tipo)
  if (filtros.carrera) params.append('carrera', filtros.carrera)
  if (filtros.sede) params.append('sede', filtros.sede)

  const url = `${BASE_URL}/estadisticas/${idProceso}/resultados?${params.toString()}`
  const response = await fetch(url, { headers: getHeaders() })
  if (!response.ok) throw new Error('Error al obtener resultados')
  return response.json()
}