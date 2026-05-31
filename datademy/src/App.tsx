import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProcesoProvider } from './context/ProcesoContext'
import Router from './router'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProcesoProvider>
          <Router />
        </ProcesoProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}