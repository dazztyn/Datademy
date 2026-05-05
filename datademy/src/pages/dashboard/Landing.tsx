import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroBanner from '../../components/HeroBanner'
import ListaFormularios from '../../components/ListaFormularios'
import BotonVerDetalles from '../../components/BotonVerDetalles'
import ThemeToggle from '../../components/ThemeToggle'
import ModalCrearProceso from '../../components/ModalCrearProceso'
import { useFormularios } from '../../hooks/useFormularios'

export default function Landing() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const navigate = useNavigate()
  const { formularios, cargando, error, recargar } = useFormularios()

  const procesoSeleccionado = formularios.find(f => f.idProceso === seleccionado)
  const puedeVer = !!(
    procesoSeleccionado &&
    procesoSeleccionado.formularios.formulario_socios !== null &&
    procesoSeleccionado.formularios.formulario_estudiantes !== null
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <HeroBanner nombre="Nombre" />

      <div className="max-w-xl mx-auto px-6 pb-24">
        {/* Cabecera de la lista */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Procesos disponibles
          </h2>
          <button
            onClick={() => setModalAbierto(true)}
            className="text-xs px-4 py-1.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
          >
            + Crear
          </button>
        </div>

        {cargando && (
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">
            Cargando formularios...
          </p>
        )}
        {error && (
          <p className="text-center text-red-400 text-sm py-8">{error}</p>
        )}
        {!cargando && !error && (
          <>
            <ListaFormularios
              periodos={formularios.map(f => ({
                id: f.idProceso,
                nombreProceso: f.nombreProceso,
                anio: f.anio,
                formularioAlumnos: f.formularios.formulario_estudiantes?.nombre_formulario ?? null,
                formularioClientes: f.formularios.formulario_socios?.nombre_formulario ?? null,
              }))}
              seleccionado={seleccionado}
              onSeleccionar={setSeleccionado}
            />
            <BotonVerDetalles
              activo={puedeVer}
              onClick={() => navigate('/detalles')}
            />
          </>
        )}
      </div>

      {modalAbierto && (
        <ModalCrearProceso
          onCerrar={() => setModalAbierto(false)}
          onCreado={recargar}
        />
      )}

      <ThemeToggle />
    </div>
  )
}