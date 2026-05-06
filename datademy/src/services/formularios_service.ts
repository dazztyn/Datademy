import type { ListarResponse, Proceso, PlantillasResponse, Plantilla } from '../types/formulario'

const BASE_URL = 'http://localhost:3000'

export async function listarFormularios(): Promise<Proceso[]> {
  const response = await fetch(`${BASE_URL}/formularios/listar`)
  if (!response.ok) throw new Error('Error al obtener formularios')
  const data: ListarResponse = await response.json()
  return data.procesos
}

export async function crearFormulario(nombreProceso: string, anio: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/formularios/crear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_proceso: nombreProceso, anio }),
  })
  if (!response.ok) throw new Error('Error al crear formulario')
}
export async function obtenerPlantillas(): Promise<Plantilla[]> {
  const response = await fetch(`${BASE_URL}/formularios/plantillas`)
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idPlantilla, nombreNuevoFormulario, tipoFormulario }),
  })
  if (!response.ok) throw new Error('Error al vincular formulario')
}