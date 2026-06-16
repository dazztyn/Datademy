import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProcesoProvider } from './context/ProcesoContext'
import { InformeProvider } from './context/InformeContext'
import Router from './router'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProcesoProvider>
          <InformeProvider>
          <Router />
          </InformeProvider>
        </ProcesoProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}