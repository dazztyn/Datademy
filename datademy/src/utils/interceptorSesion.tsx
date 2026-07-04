const BASE_URL = import.meta.env.VITE_API_URL
 
const STATUS_SESION_EXPIRADA = 401
const STATUS_PROCESO_NO_ENCONTRADO = 404

const RUTAS_EXCLUIDAS = ['/auth/google-token', '/auth/logout']
 
let interceptorInstalado = false
 
export function instalarInterceptorSesion() {
  if (interceptorInstalado) return
  interceptorInstalado = true
 
  const fetchOriginal = window.fetch
 
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await fetchOriginal(...args)
 
    const input = args[0]
    const url = typeof input === 'string' ? input : (input as Request).url
 
    const esLlamadaAlBackend = url.startsWith(BASE_URL)
    const esRutaExcluida = RUTAS_EXCLUIDAS.some(ruta => url.includes(ruta))
 
    if (esLlamadaAlBackend && !esRutaExcluida && response.status === STATUS_SESION_EXPIRADA) {
      window.dispatchEvent(new Event('google-session-expired'))
    }

    const idProcesoActivo = sessionStorage.getItem('idProceso')
    if (
      esLlamadaAlBackend &&
      idProcesoActivo &&
      url.includes(`/${idProcesoActivo}`) &&
      response.status === STATUS_PROCESO_NO_ENCONTRADO
    ) {
      window.dispatchEvent(new Event('proceso-eliminado'))
    }
 
    return response
  }
}
