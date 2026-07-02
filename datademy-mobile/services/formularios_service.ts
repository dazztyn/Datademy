import * as SecureStore from 'expo-secure-store';
import type { ListarResponse, Proceso, PlantillasResponse, Plantilla } from '../types/formulario';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getHeaders(): Promise<HeadersInit> {
  const jwt = await SecureStore.getItemAsync('jwt');
  return {
    'Content-Type': 'application/json',
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };
}

export async function listarFormularios(): Promise<Proceso[]> {
  console.log(`Llamando a NestJS: ${BASE_URL}/formularios/listar`);
  
  const response = await fetch(`${BASE_URL}/formularios/listar`, {
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const errorReal = await response.text();
    console.error(`NestJS rechazó la petición (Status ${response.status}):`, errorReal);
    throw new Error(`Error Backend (${response.status}): ${errorReal}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.procesos || []);
}

export async function crearFormulario(nombreProceso: string, anio: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/crear`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ nombre_proceso: nombreProceso, anio }),
  })
  if (!response.ok) throw new Error('Error al crear formulario')
}

export async function obtenerPlantillas(tipo?: 'estudiantes' | 'socios'): Promise<Plantilla[]> {
  const url = tipo
    ? `${BASE_URL}/formularios/plantillas?tipo=${tipo}`
    : `${BASE_URL}/formularios/plantillas`
  const response = await fetch(url, { headers: await getHeaders() })
  if (!response.ok) throw new Error('Error al obtener plantillas')
  const data: PlantillasResponse = await response.json()
  return data.datos
}

export async function vincularFormulario(
  idProceso: string,
  idPlantilla: string,
  nombreNuevoFormulario: string,
  tipoFormulario: 'estudiantes' | 'socios'
): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/${idProceso}/vincular-formulario`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ idPlantilla, nombreNuevoFormulario, tipoFormulario }),
  })
  if (!response.ok) throw new Error('Error al vincular formulario')
}

export async function sincronizarPlantillas(idCarpeta: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/sincronizar-plantillas`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ idCarpeta }),
  })
  if (!response.ok) throw new Error('Error al sincronizar plantillas')
}

export async function configurarCarpetaDestino(idCarpeta: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/configurar-carpeta-destino`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ idCarpeta }),
  })
  if (!response.ok) throw new Error('Error al configurar carpeta destino')
}

export interface InformeGenerado {
  id_informe_drive: string;
  nombre_informe: string;
  url_descarga: string;
  url_edicion: string;
  fecha_generacion: string;
}

export async function obtenerInformes(idProceso: string): Promise<InformeGenerado[]> {
  const response = await fetch(`${BASE_URL}/formularios/${idProceso}/informes`, {
    headers: await getHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener los informes generados');
  const data = await response.json();
  return data.informes || [];
}

export interface PromedioPagina {
  nombre_constructo: string;
  promedio_constructo: number;
}

export interface DetalleDimension {
  numero_pagina: number;
  nombre_constructo: string;
  preguntas: { pregunta: string; promedio: number; total_respuestas: number }[];
}

export interface Metricas {
  total_esperados: number;
  total_encuestados: number;
  tasa_respuesta_porcentaje: number;
  distribucion_genero: { genero: string; cantidad: number }[];
  promedios_por_pagina: PromedioPagina[];
  promedio_satisfaccion_general: number;
  nps_satisfaccion: {
    score_nps: number;
    distribucion_porcentajes: { promotores_pct: number; pasivos_pct: number; detractores_pct: number };
  } | null;
  fiabilidad_constructos?: { numero_pagina: number; nombre_constructo: string; alfa_cronbach_global: number }[];
  detalle_por_dimension?: DetalleDimension[];
}

export async function obtenerMetricas(idProceso: string, tipo: 'estudiantes' | 'socios'): Promise<Metricas> {
  const response = await fetch(`${BASE_URL}/estadisticas/${idProceso}/metricas?tipo=${tipo}`, {
    headers: await getHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener las métricas');
  const data = await response.json();
  return data.metricas;
}

export async function obtenerResultados(idProceso: string, tipo: 'estudiantes' | 'socios'): Promise<Record<string, any>[]> {
  const response = await fetch(`${BASE_URL}/estadisticas/${idProceso}/resultados?tipo=${tipo}`, {
    headers: await getHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener las respuestas');
  const data = await response.json();
  return data.datos || [];
}

export async function sincronizarManual(idProceso: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/estadisticas/${idProceso}/sincronizar-manual`, {
    method: 'POST',
    headers: await getHeaders(),
  });
  if (!response.ok) throw new Error('Error al sincronizar');
}