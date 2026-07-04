const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}

export type RolUsuarioAdmin = 'admin' | 'profesor'

export interface UsuarioAdmin {
  _id: string
  correo: string
  nombre: string
  rol: RolUsuarioAdmin
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface NuevoUsuarioAdmin {
  correo: string
  nombre: string
  rol: RolUsuarioAdmin
  activo: boolean
}

export interface EliminacionUsuarioResultado {
  estado: string
  mensaje: string
  detalles: {
    respuestas_borradas: number
    procesos_borrados: number
    configs_reportes_borradas: number
  }
}

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const response = await fetch(`${BASE_URL}/admin/usuarios`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Error al listar usuarios')
  return response.json()
}

export async function crearUsuario(datos: NuevoUsuarioAdmin): Promise<{ estado: string; mensaje: string }> {
  const response = await fetch(`${BASE_URL}/admin/usuarios`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(datos),
  })
  if (!response.ok) throw new Error('Error al crear usuario')
  return response.json()
}

export async function eliminarUsuario(id: string): Promise<EliminacionUsuarioResultado> {
  const response = await fetch(`${BASE_URL}/admin/usuarios/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Error al eliminar usuario')
  return response.json()
}