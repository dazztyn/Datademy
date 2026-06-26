import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Landing from '../pages/dashboard/Landing'
import Detalles from '../pages/dashboard/Detalles'
import Visualizar from '../pages/dashboard/secciones/VisualizarDatos'
import ListarResultados from '../pages/dashboard/secciones/ListarResultados'
import Cronbach from '../pages/dashboard/secciones/Cronbach'
import CompletarDatos from '../pages/dashboard/secciones/CompletarDatos'
import GenerarInforme from '../pages/dashboard/secciones/GenerarInforme'
import DatosGlobales from '../pages/dashboard/DatosGlobales'


import { useAuth } from '../context/AuthContext'

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white/60 text-sm animate-pulse">Verificando credenciales...</p>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RutaProtegida><Landing /></RutaProtegida>} />
        <Route path="/datos-globales" element={<RutaProtegida><DatosGlobales /></RutaProtegida>} />
        <Route path="detalles" element={<RutaProtegida><Detalles /></RutaProtegida>}>
          <Route index element={<p className="text-white/70 text-sm">Selecciona una sección del menú</p>} />
          <Route path="listado" element={<ListarResultados />} />
          <Route path="graficos" element={<Visualizar />} />
          <Route path="cronbach" element={<Cronbach />} />
          <Route path="completar" element={<CompletarDatos />} />
          <Route path="informe" element={<GenerarInforme />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}