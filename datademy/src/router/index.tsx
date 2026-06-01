import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Landing from '../pages/dashboard/Landing'
import Detalles from '../pages/dashboard/Detalles'
import Visualizar from '../pages/dashboard/secciones/VisualizarDatos'
import ListarResultados from '../pages/dashboard/secciones/ListarResultados'
function RutaProtegida({ children }: { children: React.ReactNode }) {
  const jwt = sessionStorage.getItem('jwt')
  return jwt ? <>{children}</> : <Navigate to="/login" />
}
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RutaProtegida><Landing /></RutaProtegida>} />
        <Route path="detalles" element={<RutaProtegida><Detalles /></RutaProtegida>}>
          <Route index element={<p className="text-white/70 text-sm">Selecciona una sección del menú</p>} />
          <Route path="alumnos" element={<ListarResultados />} />
          <Route path="socios" element={<p className="text-white/70 text-sm">Lista de socios — próximamente</p>} />
          <Route path="graficos" element={<Visualizar />} />
          <Route path="cronbach" element={<p className="text-white/70 text-sm">Cronbach — próximamente</p>} />
          <Route path="informe" element={<p className="text-white/70 text-sm">Generar informe — próximamente</p>} />
          <Route path="completar" element={<p className="text-white/70 text-sm">Completar datos — próximamente</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}