import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroBanner from '../../components/HeroBanner'
import ListaFormularios from '../../components/ListaFormularios'
import BotonVerDetalles from '../../components/BotonVerDetalles'
import ThemeToggle from '../../components/ThemeToggle'

const periodosMock = [
  { id: '1', anio: 2025, semestre: 1 as const, formularioAlumnos: null, formularioClientes: null },
  { id: '2', anio: 2024, semestre: 2 as const, formularioAlumnos: 'Form alumnos 2024-2', formularioClientes: 'Form clientes 2024-2' },
  { id: '3', anio: 2024, semestre: 1 as const, formularioAlumnos: 'Form alumnos 2024-1', formularioClientes: null },
]

export default function Landing() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const navigate = useNavigate()
  const periodoSeleccionado = periodosMock.find(p => p.id === seleccionado)
  const puedeVer = !!(
    periodoSeleccionado &&
    periodoSeleccionado.formularioAlumnos !== null &&
    periodoSeleccionado.formularioClientes !== null
  )

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-900 transition-colors duration-300">
      <HeroBanner nombre="Nombre" />

      <div className="max-w-xl mx-auto px-6 pb-24">
        <ListaFormularios
          periodos={periodosMock}
          seleccionado={seleccionado}
          onSeleccionar={setSeleccionado}
        />
        <BotonVerDetalles
           activo={puedeVer ?? false}
            onClick={() => navigate('/detalles')}
        />
      </div>

      <ThemeToggle />
    </div>
  )
}