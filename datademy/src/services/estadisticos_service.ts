const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  }
}

export interface Metricas {
  total_esperados: number
  total_encuestados: number
  tasa_respuesta_porcentaje: number
  distribucion_genero: { genero: string; cantidad: number }[]
  promedios_por_pagina: {
    numero_pagina: number
    nombre_constructo?: string
    promedio_constructo: number
  }[]
  promedio_satisfaccion_general: number
  detalle_por_dimension: {
    numero_pagina: number
    nombre_constructo: string
    preguntas: {
      pregunta: string
      promedio: number
      total_respuestas: number
      distribucion_frecuencias: Record<string, number>
    }[]
  }[]
  ranking_preguntas: {
    top_3: { pregunta: string; promedio: number }[]
    bottom_3: { pregunta: string; promedio: number }[]
  }
  nps_satisfaccion: {
    score_nps: number
    distribucion_porcentajes: {
      promotores_pct: number
      pasivos_pct: number
      detractores_pct: number
    }
    cantidades_reales: {
      promotores: number
      pasivos: number
      detractores: number
      total: number
    }
  }
  fiabilidad_constructos: {
    numero_pagina: number
    nombre_constructo: string
    alfa_cronbach_global: number
    alfa_si_se_elimina_pregunta: Record<string, number>
  }[]
  satisfaccion_por_carrera: any[]
  satisfaccion_por_sede: any[]
  satisfaccion_por_organizacion: any[]
  tabla_socios_comunitarios: any[]
}

export interface MetricasResponse {
  status: string
  estado?: string
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
  nombres_constructos?: { id: number; nombre: string }[]
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
  if (filtros.organizacion) params.append('organizacion', filtros.organizacion)

  const url = `${BASE_URL}/estadisticas/${idProceso}/metricas?${params.toString()}`
  const response = await fetch(url, { 
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Error al obtener métricas')
  const data: MetricasResponse = await response.json()
  return data.metricas
}
export async function sincronizarManual(idProceso: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/estadisticas/${idProceso}/sincronizar-manual`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
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
  organizacion?: string
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
  nombres_constructos?: { id: number; nombre: string }[]
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
  if (filtros.organizacion) params.append('organizacion', filtros.organizacion)

  const url = `${BASE_URL}/estadisticas/${idProceso}/resultados?${params.toString()}`
  const response = await fetch(url, { headers: getHeaders(), credentials: 'include', })
  if (!response.ok) throw new Error('Error al obtener resultados')
  return response.json()
}
export interface FiltrosDisponibles {
  carreras?: string[]
  sedes?: string[]
  generos?: string[]
  niveles_formativos?: string[]
  organizaciones?: string[]
  nombres_constructos?: { id: number; nombre: string }[]
}

export async function obtenerFiltrosDisponibles(
  idProceso: string,
  tipo: 'estudiantes' | 'socios'
): Promise<FiltrosDisponibles> {
  const response = await fetch(
    `${BASE_URL}/estadisticas/${idProceso}/filtros-disponibles?tipo=${tipo}`,
    { headers: getHeaders(), credentials: 'include',}
  )
  if (!response.ok) throw new Error('Error al obtener filtros')
  const data = await response.json()
  return data.filtros_disponibles ?? {}
}
export interface CantidadPaginasResponse {
  estado: string
  cantidad_paginas_total: number
  cantidad_constructos: number
}

export async function obtenerCantidadPaginas(
  idProceso: string,
  tipo: 'estudiantes' | 'socios'
): Promise<CantidadPaginasResponse> {
  const response = await fetch(
    `${BASE_URL}/formularios/${idProceso}/cantidad-constructos?tipo=${tipo}`,
    { headers: getHeaders(), credentials: 'include' }
  )
  if (!response.ok) throw new Error('Error al obtener cantidad de páginas')
  return response.json()
}