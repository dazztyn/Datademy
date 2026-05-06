import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Landing from '../pages/dashboard/Landing'
import Detalles from '../pages/dashboard/Detalles'

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Landing />} />
        <Route path="/detalles" element={<Detalles />}>
          <Route index element={<p className="text-slate-500">Selecciona una sección del menú</p>} />
          <Route path="formularios" element={<p className="text-slate-500">Sección formularios — próximamente</p>} />
          <Route path="visualizar" element={<p className="text-slate-500">Sección visualizar datos — próximamente</p>} />
          <Route path="informe" element={<p className="text-slate-500">Sección generar informe — próximamente</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}