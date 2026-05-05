import { ThemeProvider } from './context/ThemeContext'
import Router from './router'

export default function App() {
  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  )
}
