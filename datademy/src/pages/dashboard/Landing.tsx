import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroBanner from '../../components/HeroBanner'
import ListaFormularios from '../../components/ListaFormularios'
import BotonVerDetalles from '../../components/BotonVerDetalles'
import ThemeToggle from '../../components/ThemeToggle'
import ModalCrearProceso from '../../components/ModalCrearProceso'
import { useFormularios } from '../../hooks/useFormularios'
import { sincronizarPlantillas, configurarCarpetaDestino } from '../../services/formularios_service'
import { useGooglePicker } from '../../hooks/useGooglePicker'

export default function Landing() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const navigate = useNavigate()
  const { formularios, cargando, error, recargar } = useFormularios()
  const { abrirPicker: abrirPickerPlantillas } = useGooglePicker({
  onSeleccionada: async (idCarpeta) => {
    try {
      await sincronizarPlantillas(idCarpeta)
      alert('Carpeta de plantillas configurada correctamente')
    } catch {
      alert('Error al configurar carpeta de plantillas')
    }
  }
})

const { abrirPicker: abrirPickerDestino } = useGooglePicker({
  onSeleccionada: async (idCarpeta) => {
    try {
      await configurarCarpetaDestino(idCarpeta)
      alert('Carpeta destino configurada correctamente')
    } catch {
      alert('Error al configurar carpeta destino')
    }
  }
})
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
                <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Procesos disponibles
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={abrirPickerPlantillas}
              className="text-xs px-4 py-1.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
            >
              Plantillas
            </button>
            <button
              onClick={abrirPickerDestino}
              className="text-xs px-4 py-1.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
            >
               Carpeta Destino
            </button>
            <button
              onClick={() => setModalAbierto(true)}
              className="text-xs px-4 py-1.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #f59e0b, #ea580c)' }}
            >
              + Crear proceso
            </button>
          </div>
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
              onRecargar={recargar}
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