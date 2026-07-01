import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { toggleTheme, theme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-5 right-5 z-50 border shadow-md rounded-full px-4 py-2 text-xl transition-all duration-300 hover:shadow-lg
        ${theme === 'light'
          ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-800 hover:text-white hover:border-slate-800'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-white hover:text-slate-800 hover:border-slate-200'
        }`}
    >
      {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    </button>
  )
}