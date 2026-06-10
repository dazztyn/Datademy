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
    promedio_constructo: number
    nombre_constructo?: string
    preguntas: Record<string, number>
  }[]
  promedio_satisfaccion_general: number
  fiabilidad_constructos: {
    numero_pagina: number
    alfa_cronbach_global: number
    alfa_si_se_elimina_pregunta: Record<string, number>
  }[]
}

export interface MetricasResponse {
  status: string
  metricas: Metricas
}

export interface FiltrosMetricas {
  tipo?: 'estudiantes' | 'socios'
  carrera?: string
  sede?: string
  genero?: string
  pagina?: number
  nivel_formativo?: string
  organizacion?: string
  
}

export async function obtenerMetricas(
  idProceso: string,
  filtros: FiltrosMetricas = {}
): Promise<Metricas> {
  const params = new URLSearchParams()
  if (filtros.tipo) params.append('tipo', filtros.tipo)
  if (filtros.carrera) params.append('carrera', filtros.carrera)
  if (filtros.sede) params.append('sede', filtros.sede)
  if (filtros.genero) params.append('genero', filtros.genero)
  if (filtros.pagina !== undefined) params.append('pagina', String(filtros.pagina))
  if (filtros.nivel_formativo) params.append('nivel_formativo', filtros.nivel_formativo)
    

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
  genero?: string
  nivel_formativo?: string
  organizacion?: string
}

export async function obtenerResultados(
  idProceso: string,
  filtros: FiltrosResultados = {}
): Promise<ResultadosResponse> {
  const params = new URLSearchParams()
  if (filtros.tipo) params.append('tipo', filtros.tipo)
  if (filtros.carrera) params.append('carrera', filtros.carrera)
  if (filtros.sede) params.append('sede', filtros.sede)
  if (filtros.sede) params.append('sede', filtros.sede)
  if (filtros.genero) params.append('genero', filtros.genero)
  if (filtros.nivel_formativo) params.append('nivel_formativo', filtros.nivel_formativo)

  const url = `${BASE_URL}/estadisticas/${idProceso}/resultados?${params.toString()}`
  const response = await fetch(url, { headers: getHeaders() })
  if (!response.ok) throw new Error('Error al obtener resultados')
  return response.json()
}
export interface FiltrosDisponibles {
  carreras?: string[]
  sedes?: string[]
  generos?: string[]
  niveles_formativos?: string[]
  organizaciones?: string[]
}

export async function obtenerFiltrosDisponibles(
  idProceso: string,
  tipo: 'estudiantes' | 'socios'
): Promise<FiltrosDisponibles> {
  const response = await fetch(
    `${BASE_URL}/estadisticas/${idProceso}/filtros-disponibles?tipo=${tipo}`,
    { headers: getHeaders() }
  )
  if (!response.ok) throw new Error('Error al obtener filtros')
  const data = await response.json()
  return data.filtros_disponibles
}