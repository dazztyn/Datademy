const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  }
}

export async function configurarReportes(config: {
  idCarpeta?: string
  idPlantilla?: string
}): Promise<void> {
  const response = await fetch(`${BASE_URL}/reportes/configurar`, {
    method: 'PATCH',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(config),
  })
  if (!response.ok) throw new Error('Error al configurar reportes')
}