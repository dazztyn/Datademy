import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import Router from './router'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  )
}