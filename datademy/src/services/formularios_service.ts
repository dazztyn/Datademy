import type { ListarResponse, Proceso, PlantillasResponse, Plantilla } from '../types/formulario'

const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  }
}
export async function configurarMetadatos(
  idProceso: string,
  tipoFormulario: 'estudiantes' | 'socios',
  nombresConstructos: string[],
  totalEsperados: number
): Promise<void> {

  const response = await fetch(`${BASE_URL}/formularios/${idProceso}/configurar-metadatos`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ tipoFormulario, nombresConstructos, totalEsperados }),
  })
  if (!response.ok) throw new Error('Error al configurar metadatos')
}

export async function listarFormularios(): Promise<Proceso[]> {
  const response = await fetch(`${BASE_URL}/formularios/listar`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Error al obtener formularios')
  const data: ListarResponse = await response.json()
  return data.procesos
}

export async function crearFormulario(nombreProceso: string, anio: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/crear`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ nombre_proceso: nombreProceso, anio }),
  })
  if (!response.ok) throw new Error('Error al crear formulario')
}

export async function obtenerPlantillas(tipo?: 'estudiantes' | 'socios'): Promise<Plantilla[]> {
  const url = tipo
    ? `${BASE_URL}/formularios/plantillas?tipo=${tipo}`
    : `${BASE_URL}/formularios/plantillas`
  const response = await fetch(url, { headers: getHeaders(), credentials: 'include', })
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
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ idPlantilla, nombreNuevoFormulario, tipoFormulario }),
  })
  if (!response.ok) throw new Error('Error al vincular formulario')
}

export async function sincronizarPlantillas(idCarpeta: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/sincronizar-plantillas`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ idCarpeta }),
  })
  if (!response.ok) throw new Error('Error al sincronizar plantillas')
}

export async function configurarCarpetaDestino(idCarpeta: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/configurar-carpeta-destino`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ idCarpeta }),
  })
  if (!response.ok) throw new Error('Error al configurar carpeta destino')
}
export async function vincularExistente(
  idProceso: string,
  idGoogleForm: string,
  tipoFormulario: 'estudiantes' | 'socios'
): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/${idProceso}/vincular-existente`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ idGoogleForm, tipoFormulario }),
  })
  if (!response.ok) throw new Error('Error al vincular formulario existente')
}
export async function eliminarProceso(idProceso: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/${idProceso}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Error al eliminar proceso')
}

export async function desasignarFormulario(
  idProceso: string,
  tipoFormulario: 'estudiantes' | 'socios'
): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/${idProceso}/desasignar/${tipoFormulario}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ tipoFormulario }),
  })
  if (!response.ok) throw new Error('Error al desasignar formulario')
}
export interface Informe {
  id_informe_drive: string
  nombre_informe: string
  url_descarga: string
  fecha_generacion: string
}

export async function listarInformes(idProceso: string): Promise<Informe[]> {
  const response = await fetch(`${BASE_URL}/formularios/${idProceso}/informes`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Error al listar informes')
  return response.json()
}

export async function eliminarInforme(idProceso: string, idInformeDrive: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/${idProceso}/informes/${idInformeDrive}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Error al eliminar informe')
}