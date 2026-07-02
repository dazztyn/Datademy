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
import Toast from '../../components/Toast'
import { useToast } from '../../hooks/useToast'
import { useProceso } from '../../context/ProcesoContext'
import iconoCarpeta from '../../assets/FOLDER.png'
import ModalBienvenida from '../../components/ModalBienvenidainfo'
import CerrarSesionBtn from '../../components/CerrarSesionBtn'

export default function Landing() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const navigate = useNavigate()
  const { setIdProceso } = useProceso()
  const { toast, mostrar, cerrar } = useToast()
  const { formularios, cargando, error, recargar } = useFormularios()
  const [mostrarBienvenida, setMostrarBienvenida] = useState(() => {
    const yaVisto = localStorage.getItem('datademy_bienvenida_vista')
    return yaVisto !== 'true' 
  })
  const manejarCerrarModal = () => {
    localStorage.setItem('datademy_bienvenida_vista', 'true') 
    setMostrarBienvenida(false)
  }
  const { abrirPicker: abrirPickerPlantillas, isReady: isReadyPlantillas } = useGooglePicker({
  onSeleccionada: async (idCarpeta) => {
    mostrar('Sincronizando plantillas...', 'cargando')
    try {
      await sincronizarPlantillas(idCarpeta)
      mostrar('Carpeta de plantillas configurada correctamente', 'exito')
    } catch {
      mostrar('Error al configurar carpeta de plantillas', 'error')
    }
  }
})

const { abrirPicker: abrirPickerDestino, isReady: isReadyDestino } = useGooglePicker({
  onSeleccionada: async (idCarpeta) => {
    mostrar('Configurando carpeta destino...', 'cargando')
    try {
      await configurarCarpetaDestino(idCarpeta)
      mostrar('Carpeta destino configurada correctamente', 'exito')
    } catch {
      mostrar('Error al configurar carpeta destino', 'error')
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
      <HeroBanner nombre="a Datademy" />

      <div className="max-w-3xl mx-auto px-6 pb-24">
        
        <div className="flex md:flex-row items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-3">
            <button
              onClick={() => setMostrarBienvenida(true)}
              className="flex items-center justify-center w-13 h-13 rounded-full border border-slate-700 dark:border-blue-200 text-slate-700 dark:text-blue-200 hover:text-blue-500 hover:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400 transition-colors text-lg font-bold shadow-sm"
              title="Ver info de bienvenida"
            >
              i
            </button>

            <h1 className="text-lg font-semibold text-slate-700 dark:text-blue-200">
              Procesos disponibles
            </h1>
      </div>
              <div className="flex items-center gap-3">
        <button
          onClick={abrirPickerPlantillas}
          disabled={!isReadyPlantillas}
          className={`text-lg flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium transition-all duration-200
          ${isReadyPlantillas
            ? 'hover:scale-105 active:scale-95 cursor-pointer shadow-md'
            : 'opacity-40 cursor-not-allowed filter grayscale'
          }`}
          style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
        >
          <img
            src={iconoCarpeta}
            alt="Carpeta Plantillas"
            className="w-7 h-7 object-contain brightness-0 invert"
          />
          <span>Carpeta Plantillas</span>
        </button>

        <button
          onClick={abrirPickerDestino}
          disabled={!isReadyDestino}
          className={`text-lg flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium transition-all duration-200
          ${isReadyDestino
            ? 'hover:scale-105 active:scale-95 cursor-pointer shadow-md'
            : 'opacity-40 cursor-not-allowed filter grayscale'
          }`}
          style={{ background: 'linear-gradient(to right, #5fb7bb, #0d438b)' }}
        >
          <img
            src={iconoCarpeta}
            alt="Carpeta Destino"
            className="w-7 h-7 object-contain brightness-0 invert"
          />
          <span>Carpeta Destino</span>
        </button>

        <button
          onClick={() => setModalAbierto(true)}
          className="text-lg px-4 py-2 rounded-full text-white font-medium hover:scale-105 transition-opacity"
          style={{ background: 'linear-gradient(to right, #f59e0b, #ea580c)' }}
        >
          + Crear proceso
        </button>
      </div>
        </div>

        {cargando && (
          <p className="text-center text-slate-700 dark:text-blue-200 text-lg py-8">
            Cargando formularios...
          </p>
        )}
        {error && (
          <p className="text-center text-red-400 text-lg py-8">{error}</p>
        )}
        {!cargando && !error && (
          <>
            <ListaFormularios
              periodos={formularios.map(f => ({
                id: f.idProceso,
                nombreProceso: f.nombreProceso,
                year: f.anio,
                formularioAlumnos: f.formularios.formulario_estudiantes?.nombre_formulario ?? null,
                formularioClientes: f.formularios.formulario_socios?.nombre_formulario ?? null,
                idGoogleFormAlumnos: f.formularios.formulario_estudiantes?.id_google_form ?? null,
                idGoogleFormClientes: f.formularios.formulario_socios?.id_google_form ?? null,
              }))}
              seleccionado={seleccionado}
              onSeleccionar={setSeleccionado}
              onReload={() => {
                  recargar()
                  mostrar('Formulario asignado correctamente', 'exito')
                }}
              onEliminar={() => mostrar('Proceso eliminado correctamente', 'exito')}
            />
           <BotonVerDetalles
              activo={puedeVer}
              onClick={() => {
                if (seleccionado) setIdProceso(seleccionado)
                navigate('/detalles/completar')
              }}
            />
            <button
              onClick={() => navigate('/datos-globales')}
              className="w-full mt-4 py-3.5 rounded-2xl font-medium text-xl transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 opacity-100 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/30"
            >
              Ver datos globales
            </button>
          </>
        )}
      </div>

      {modalAbierto && (
        <ModalCrearProceso
          onCerrar={() => setModalAbierto(false)}
          onCreado={recargar}
        />
      )}
      {toast && (
      <Toast
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={cerrar}
        
      />
    )}
      <ThemeToggle />
    {mostrarBienvenida && (
        <ModalBienvenida onCerrar={manejarCerrarModal} />
      )}
      <CerrarSesionBtn/>
    </div>
    
  )
}