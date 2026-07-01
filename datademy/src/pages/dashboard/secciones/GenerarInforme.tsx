import { useState, useRef, useEffect } from 'react'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useToast } from '../../../hooks/useToast'
import { configurarReportes } from '../../../services/informes_service'
import Toast from '../../../components/Toast'
import { Pie, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, LinearScale, CategoryScale } from 'chart.js'
import { temasPagina, temaDefault } from '../../../utils/temasPagina'
import { useLocation } from 'react-router-dom'
import { useGooglePicker } from '../../../hooks/useGooglePicker'
import { useFiltrosDisponibles } from '../../../hooks/useFiltrosDisponibles'
import { usePersistedState } from '../../../hooks/usePersistentState'
import { useInforme } from '../../../context/InformeContext'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels)

const COLORES = ['#5fb7bb', '#0d438b', '#7f458f']
const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}
function mapearTablaPromediosParaWord(
  promediosEstudiantes: any[],
  nombresConstructosEst: string[],
  promedioGeneralEst: number,
  promediosSocios: any[],
  nombresConstructosSoc: string[],
  promedioGeneralSoc: number
): Record<string, string> {
  const variablesWord: Record<string, string> = {}
  const LIMITE_ETIQUETAS = 10

  const iteracionesEst = Math.max(nombresConstructosEst.length, LIMITE_ETIQUETAS)
  for (let i = 0; i < iteracionesEst; i++) {
    if (i < nombresConstructosEst.length) {
      const nombre = nombresConstructosEst[i]
      const constructoCalc = promediosEstudiantes.find((p: any) => p.nombre_constructo === nombre)
      variablesWord[`D_${i + 1}`] = nombre
      variablesWord[`P_${i + 1}`] = constructoCalc ? constructoCalc.promedio_constructo.toFixed(1) : '0.0'
    } else {
      variablesWord[`D_${i + 1}`] = ''
      variablesWord[`P_${i + 1}`] = ''
    }
  }
  variablesWord['P_G'] = promedioGeneralEst > 0 ? promedioGeneralEst.toFixed(1) : ''

  const iteracionesSoc = Math.max(nombresConstructosSoc.length, LIMITE_ETIQUETAS)
  for (let i = 0; i < iteracionesSoc; i++) {
    if (i < nombresConstructosSoc.length) {
      const nombre = nombresConstructosSoc[i]
      const constructoCalc = promediosSocios.find((p: any) => p.nombre_constructo === nombre)
      variablesWord[`DS_${i + 1}`] = nombre
      variablesWord[`PS_${i + 1}`] = constructoCalc ? constructoCalc.promedio_constructo.toFixed(1) : '0.0'
    } else {
      variablesWord[`DS_${i + 1}`] = ''
      variablesWord[`PS_${i + 1}`] = ''
    }
  }
  variablesWord['PG_S'] = promedioGeneralSoc > 0 ? promedioGeneralSoc.toFixed(1) : ''

  return variablesWord
}
function fmt(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '—'
  return value.toFixed(decimals)
}
function wrapTextParaEtiqueta(texto: string, maxCaracteresPorLinea: number): string[] {
  const palabras = texto.split(' ')
  const lineas: string[] = []
  let lineaActual = ''

  for (const palabra of palabras) {
    const candidata = lineaActual ? `${lineaActual} ${palabra}` : palabra
    if (candidata.length > maxCaracteresPorLinea && lineaActual) {
      lineas.push(lineaActual)
      lineaActual = palabra
    } else {
      lineaActual = candidata
    }
  }
  if (lineaActual) lineas.push(lineaActual)
  return lineas
}
type FiltrosInforme = {
  carrera: string
  asignatura: string
  sede: string
  nivelFormativo: string
}
export default function GenerarInforme() {
  const { idProceso } = useProceso()
  const { estadoJob, urlInforme, iniciarPolling, resetear } = useInforme()
  const { toast, mostrar, cerrar } = useToast()
  const location = useLocation()
  const tema = temasPagina[location.pathname] ?? temaDefault

  const pieRef = useRef<ChartJS<'pie'> | null>(null)
  const barrasRefs = useRef<Record<number, ChartJS<"bar", number[], string[]> | null | undefined>>({})
  const barrasSociosRefs = useRef<Record<number, ChartJS<"bar", number[], string[]> | null | undefined>>({})

  const { filtros: filtrosDisponibles } = useFiltrosDisponibles(idProceso, 'estudiantes')

  const [asignaturaNombre, setAsignaturaNombre] = usePersistedState('asignatura', '')
  const [carrera, setCarrera] = usePersistedState('carrera', '')
  const [programa, setPrograma] = usePersistedState('programa', '')
  const [mesInicio, setMesInicio] = usePersistedState('mesInicio', '')
  const [mesFinal, setMesFinal] = usePersistedState('mesFinal', '')
  const [anio, setAnio] = usePersistedState('anio', String(new Date().getFullYear()))
  const [nombreUsuario, setNombreUsuario] = usePersistedState('nombreUsuario', '')
  const [sede, setSede] = usePersistedState('sede', '')
  const [nombreDocente, setNombreDocente] = usePersistedState('nombreDocente', '')

  const [carpetaConfigurada, setCarpetaConfigurada] = usePersistedState('carpetaConfigurada', false)
  const [plantillaConfigurada, setPlantillaConfigurada] = usePersistedState('plantillaConfigurada', false)
  const [generando, setGenerando] = usePersistedState('generando', false)
  const [mostrarPopup, setMostrarPopup] = useState(false)

  const cerrarPopup = () => {
    setMostrarPopup(false)
    resetear() 
  }

  const [tipoAsignatura, setTipoAsignatura] = useState<'Obligatoria' | 'Electiva'>('Obligatoria')
  const [ciclo, setCiclo] = useState<'Básico' | 'Profesional'>('Básico')
  const [numSemestre, setNumSemestre] = useState('')
  const [pronombre, setPronombre] = useState<'el' | 'la'>('el')
  const [tipoClase, setTipoClase] = useState<'Asignatura' | 'Módulo'>('Asignatura')

  const [carreraManual, setCarreraManual] = usePersistedState('carreraManual', false)
  const [asignaturaManual, setAsignaturaManual] = usePersistedState('asignaturaManual', false)

  const { metricas } = useMetricas(idProceso, {
    tipo: 'estudiantes',
    carrera: carrera || undefined,
    sede: sede || undefined,
    nivel_formativo: programa || undefined,
  })
  const { metricas: metricasSocios } = useMetricas(idProceso, { tipo: 'socios' })
  const totalEstudiantes = metricas?.total_esperados ?? 0
  const totalRespuestas = metricas?.total_encuestados ?? 0
  const porcRespuestas = fmt(metricas?.tasa_respuesta_porcentaje, 1)

  const { abrirPicker: abrirPickerCarpeta } = useGooglePicker({
    modo: 'carpeta',
    onSeleccionada: async (id) => {
      mostrar('Configurando carpeta destino...', 'cargando')
      try {
        await configurarReportes({ idCarpeta: id })
        setCarpetaConfigurada(true)
        mostrar('Carpeta destino configurada', 'exito')
      } catch {
        mostrar('Error al configurar carpeta', 'error')
      }
    },
  })

  const { abrirPicker: abrirPickerPlantilla } = useGooglePicker({
    modo: 'documento',
    onSeleccionada: async (id) => {
      mostrar('Configurando plantilla...', 'cargando')
      try {
        await configurarReportes({ idPlantilla: id })
        setPlantillaConfigurada(true)
        mostrar('Plantilla configurada correctamente', 'exito')
      } catch {
        mostrar('Error al configurar plantilla', 'error')
      }
    },
  })
  const [nombresConstructosEst, setNombresConstructosEst] = useState<string[]>([])
  const [nombresConstructosSoc, setNombresConstructosSoc] = useState<string[]>([])

  useEffect(() => {
    if (!idProceso) return
    fetch(`${BASE_URL}/formularios/${idProceso}/metadatos`, {
      headers: getHeaders(),
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.metadatos?.estudiantes?.nombres_constructos) {
          setNombresConstructosEst(data.metadatos.estudiantes.nombres_constructos)
        }
        if (data.metadatos?.socios?.nombres_constructos) {
          setNombresConstructosSoc(data.metadatos.socios.nombres_constructos)
        }
      })
      .catch(() => {})
  }, [idProceso])
  const distribucionGenero = metricas?.distribucion_genero ?? []
  const datosGenero =
    distribucionGenero.length > 0
      ? {
          labels: distribucionGenero.map(d => d.genero),
          datasets: [
            {
              data: distribucionGenero.map(d => d.cantidad),
              backgroundColor: COLORES,
              borderWidth: 0,
            },
          ],
        }
      : null
  const constructosCaptura = (metricas?.detalle_por_dimension ?? [])
    .filter((_, i) => i < (metricas?.detalle_por_dimension.length ?? 0) - 1)
    .slice(0, 5)

  const promedios = metricas?.promedios_por_pagina ?? []
  const constructosSocios = (metricasSocios?.detalle_por_dimension ?? [])
  .filter((_, i) => i < (metricasSocios?.detalle_por_dimension.length ?? 0) - 1)
  .slice(0, 3)
  const meses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
  const promediosSocios = metricasSocios?.promedios_por_pagina ?? []
  useEffect(() => {
    console.log('estadoJob cambió:', estadoJob, 'urlInforme:', urlInforme)
  if (estadoJob === 'completado' && urlInforme) {
    cerrar() 
    setMostrarPopup(true)
  } else if (estadoJob === 'error') {
    cerrar()
    mostrar('Error al generar el informe', 'error')
  }
}, [estadoJob, urlInforme])

  const handleGenerar = async () => {
    if (!idProceso || !metricas) return
    if ( !carrera || !nombreUsuario || !sede || !numSemestre || !nombreDocente || !programa) {
      return mostrar('Por favor completa todos los campos obligatorios', 'error')
    }
    if (!carpetaConfigurada || !plantillaConfigurada) {
      return mostrar('Debes configurar la carpeta y plantilla del informe', 'error')
    }

    setGenerando(true)
    resetear()
    mostrar('Enviando solicitud...', 'cargando')

    try {
      const graficos: Record<string, string> = {}

      if (pieRef.current) {
        graficos['GraficoGenero'] = pieRef.current.toBase64Image()
      }

      constructosCaptura.forEach((constructo, index) => {
        const chartInstance = barrasRefs.current[constructo.numero_pagina]
        if (chartInstance) {
          graficos[`CONSTRUCTO_${index + 1}`] = chartInstance.toBase64Image()
        }
      })
      constructosSocios.forEach((constructo, index) => {
        const chartInstance = barrasSociosRefs.current[constructo.numero_pagina]
        if (chartInstance) {
          graficos[`SOCIO_DIMENSION${index + 1}`] = chartInstance.toBase64Image()
        }
      })
      const tablaPromedios = mapearTablaPromediosParaWord(
        promedios,
        nombresConstructosEst,
        metricas.promedio_satisfaccion_constructos ?? 0,
        promediosSocios,
        nombresConstructosSoc,
        metricasSocios?.promedio_satisfaccion_constructos ?? 0
      )

      const datosTexto: Record<string, string> = {
        AsignaturaModulo: asignaturaNombre,
        TipoClase: tipoClase,
        CarreraPrograma: programa ? `${carrera} - ${programa}` : carrera,
        Periodo: `${mesInicio}-${mesFinal} / ${anio}`,
        Anio: anio,
        NombreUsuario: nombreUsuario,
        Ciudad: sede,
        TotalEstudiantes: String(totalEstudiantes),
        TotalRespuestas: String(totalRespuestas),
        PorcRespuestas: `${porcRespuestas}%`,
        NombreDocente: nombreDocente,
        ToggleCiclo: ciclo,
        NumSemestre: numSemestre,
        TogglePronombre: pronombre,
        ToggleAsignatura: tipoAsignatura,
        ...tablaPromedios,
      }
      const filtros: FiltrosInforme = {
        carrera,
        asignatura: asignaturaNombre,
        sede,
        nivelFormativo: programa,
      }

      const response = await fetch(`${BASE_URL}/reportes/${idProceso}/generar`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ nombreCarrera: carrera, datosTexto, graficos, filtros }),
      })

      if (!response.ok) throw new Error()
      const data = await response.json()
      mostrar('Informe en cola, procesando...', 'cargando')
      iniciarPolling(data.jobId)
    } catch {
      mostrar('Error al enviar la solicitud', 'error')
    } finally {
      setGenerando(false)
    }
  }

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">
          No hay proceso seleccionado. Vuelve al inicio y selecciona uno.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-md focus:outline-none focus:ring-2 focus:ring-blue-400'
  const labelClass = 'text-md ml-1 text-slate-600 dark:text-slate-300 mb-1 block'
  const seccionClass =
    'bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4'
  const tituloSeccion = 'text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3'

  const Toggle = ({
    valor,
    opcion1,
    opcion2,
    onChange,
  }: {
    valor: string
    opcion1: string
    opcion2: string
    onChange: (v: any) => void
  }) => (
    <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
      {[opcion1, opcion2].map(op => (
        <button
          key={op}
          onClick={() => onChange(op)}
          className={`flex-1 py-2 rounded-lg text-md font-medium transition-all duration-200
            ${valor === op
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-400 dark:text-slate-500'
            }`}
        >
          {op}
        </button>
      ))}
    </div>
  )

const barOptions = (maxVal: number, showLabels: boolean, anchoEtiquetas?: number): any => ({
  indexAxis: 'y' as const,
  maintainAspectRatio: false,
  animation: false,
  devicePixelRatio: 2,
  layout: { padding: { right: showLabels ? 48 : 0 } },
  scales: {
    x: {
      min: 0,
      max: maxVal,
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: 'rgba(0,0,0,0.06)' },
    },
    y: {
      afterFit: anchoEtiquetas
        ? (scale: any) => { scale.width = anchoEtiquetas }
        : undefined,
      ticks: { color: '#64748b', font: { size: 10 }, autoSkip: false },
      grid: { color: 'rgba(0,0,0,0.06)' },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
    datalabels: showLabels
      ? {
          anchor: 'end' as const,
          align: 'end' as const,
          clamp: true,
          color: '#02171e',
          font: { weight: 'bold' as const, size: 15 },
          formatter: (value: number) => (value != null ? value.toFixed(2) : ''),
        }
      : { display: false },
  },
})
  useEffect(() => {
  document.title = 'Datademy - Generar Informe'
  return () => { document.title = 'Datademy' }
}, []) 
  return (
    <div className="space-y-6 w-full">
      <div className={seccionClass}>
        <h3 className={tituloSeccion}>Configuración del informe</h3>
        <p className="text-md text-slate-600 dark:text-slate-300 mb-3">
          Selecciona la carpeta donde se guardará el informe y la plantilla a usar.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={abrirPickerCarpeta}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors text-left
              ${carpetaConfigurada
                ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'border-dashed border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
          >
            <div>
              <p className="text-md font-medium text-slate-600 dark:text-slate-300">Carpeta destino</p>
              <p className={`text-md ${carpetaConfigurada ? 'text-green-500' : 'text-slate-400'}`}>
                {carpetaConfigurada ? '✓ Configurada' : 'Seleccionar en Drive'}
              </p>
            </div>
          </button>
          <button
            onClick={abrirPickerPlantilla}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors text-left
              ${plantillaConfigurada
                ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'border-dashed border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
          >
            <div>
              <p className="text-md font-medium text-slate-600 dark:text-slate-300">Plantilla del informe</p>
              <p className={`text-md ${plantillaConfigurada ? 'text-green-500' : 'text-slate-400'}`}>
                {plantillaConfigurada ? '✓ Configurada' : 'Seleccionar en Drive'}
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className={seccionClass}>
        <h3 className={tituloSeccion}>Datos generales</h3>
        <div className="grid grid-cols-2 gap-3 items-start">
  <div>
    <div className="flex items-center justify-between mb-1 h-5">
      <label className={labelClass}>Asignatura/Modulo</label>
    </div>
    <Toggle valor={tipoClase} opcion1="Asignatura" opcion2="Módulo" onChange={setTipoClase} />
  </div>
  <div>
    <div className="flex items-center justify-between mb-1 h-5">
      <label className={labelClass}>Nombre Clase</label>
      {(filtrosDisponibles?.asignaturas ?? []).length > 0 && (
        <button
          onClick={() => { setAsignaturaManual(!asignaturaManual); setAsignaturaNombre('') }}
          className="text-sm text-blue-400 hover:text-blue-500 hover:underline transition-colors"
        >
          {asignaturaManual ? 'Usar lista' : 'Ingresar manualmente'}
        </button>
      )}
    </div>
    {asignaturaManual || (filtrosDisponibles?.asignaturas ?? []).length === 0 ? (
      <input type="text" value={asignaturaNombre} onChange={e => setAsignaturaNombre(e.target.value)} placeholder="Ej: Ingeniería de Software" className={inputClass} />
    ) : (
      <select value={asignaturaNombre} onChange={e => setAsignaturaNombre(e.target.value)} className={inputClass}>
        <option value="">Selecciona una asignatura...</option>
        {(filtrosDisponibles?.asignaturas ?? []).map((a: string) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    )}
  </div>
  <div>
    <div className="flex items-center justify-between mb-1 h-5">
      <label className={labelClass}>Carrera</label>
      <button
        onClick={() => { setCarreraManual(!carreraManual); setCarrera('') }}
        className="text-sm text-blue-400 hover:text-blue-500 hover:underline transition-colors"
      >
        {carreraManual ? 'Usar lista' : 'Ingresar manualmente'}
      </button>
    </div>
    {carreraManual ? (
      <input type="text" value={carrera} onChange={e => setCarrera(e.target.value)} placeholder="Ej: Ingeniería Civil" className={inputClass} />
    ) : (
      <select value={carrera} onChange={e => setCarrera(e.target.value)} className={inputClass}>
        <option value="">Selecciona una carrera...</option>
        {(filtrosDisponibles?.carreras ?? []).map((c: string) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    )}
  </div>
  <div>
    <div className="flex items-center justify-between mb-1 h-5">
      <label className={labelClass}>Programa</label>
    </div>
    <select value={programa} onChange={e => setPrograma(e.target.value)} className={inputClass}>
      <option value="">Selecciona un programa...</option>
      {(filtrosDisponibles?.niveles_formativos ?? []).map((p: string) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </div>
</div>
        <div>
          <label className={labelClass}>Período</label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={mesInicio}
              onChange={e => setMesInicio(e.target.value)}
              className={inputClass}
            >
              <option value="">Mes inicio</option>
              {meses.map(mes => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </select>

            <select
              value={mesFinal}
              onChange={e => setMesFinal(e.target.value)}
              className={inputClass}
            >
              <option value="">Mes final</option>
              {meses.map(mes => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </select>
            <input type="text" value={anio} onChange={e => setAnio(e.target.value)} placeholder="Año" maxLength={4} className={inputClass} />
          </div>
        </div>
      </div>

      <div className={seccionClass}>
        <h3 className={tituloSeccion}>Datos personales</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)} placeholder="Ej: María González" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sede</label>
            <select value={sede} onChange={e => setSede(e.target.value)} className={inputClass}>
              <option value="">Selecciona una sede...</option>
              {(filtrosDisponibles?.sedes ?? []).map((s: string) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={seccionClass}>
        <h3 className={tituloSeccion}>Contexto de asignatura</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tipo de asignatura</label>
            <Toggle valor={tipoAsignatura} opcion1="Obligatoria" opcion2="Electiva" onChange={setTipoAsignatura} />
          </div>
          <div>
            <label className={labelClass}>Ciclo</label>
            <Toggle valor={ciclo} opcion1="Básico" opcion2="Profesional" onChange={setCiclo} />
          </div>
          <div>
            <label className={labelClass}>Pronombre docente</label>
            <Toggle valor={pronombre} opcion1="el" opcion2="la" onChange={setPronombre} />
          </div>
          <div>
            <label className={labelClass}>Número de semestre</label>
            <input type="number" min={1} max={12} value={numSemestre} onChange={e => setNumSemestre(e.target.value)} placeholder="Ej: 5" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Nombre del docente</label>
          <input type="text" value={nombreDocente} onChange={e => setNombreDocente(e.target.value)} placeholder="Ej: Dr. Juan Pérez" className={inputClass} />
        </div>
      </div>

      <div className={seccionClass}>
        <h3 className={tituloSeccion}>Caracterización estudiantes</h3>
        {metricas && metricas.total_encuestados === 0 ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Sin datos para los filtros aplicados
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Selecciona una carrera o sede con respuestas registradas para ver la caracterización y los gráficos.
            </p>
          </div>
        ) : metricas ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className="text-sm text-slate-600 mb-1 dark:text-slate-300">Total estudiantes</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{totalEstudiantes}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className="text-sm text-slate-600 mb-1 dark:text-slate-300">Total respuestas</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{totalRespuestas}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className="text-sm text-slate-600 mb-1 dark:text-slate-300">% respuestas</p>
                <p className="text-2xl font-bold" style={{ color: tema.sidebar }}>{porcRespuestas}%</p>
              </div>
            </div>
            {promedios.length > 0 && (
              <div>
                <p className="text-md text-slate-600 dark:text-slate-200 mb-2 font-medium">
                  Promedios por constructo
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {promedios.map((p, i) => (
                    <div
                      key={p.numero_pagina}
                      className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-slate-500 dark:text-slate-300 truncate">
                        {p.nombre_constructo ?? `Constructo ${i + 1}`}
                      </span>
                      <span
                        className="text-sm font-bold flex-shrink-0"
                        style={{ color: tema.sidebar }}
                      >
                        {fmt(p.promedio_constructo)}
                      </span>
                    </div>
                  ))}
                  <div className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 border-2"
                    style={{ borderColor: tema.sidebar, background: `${tema.sidebar}10` }}
                  >
                    <span className="text-md font-medium text-slate-600 dark:text-slate-300">
                      Promedio global
                    </span>
                    <span className="text-sm font-bold" style={{ color: tema.sidebar }}>
                      {fmt(metricas.promedio_satisfaccion_constructos)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {datosGenero && (
              <div className="justify-center items-center">
                <p className="text-md text-slate-600 dark:text-slate-200 mb-2 font-medium">
                  Gráfico de género (se incluirá en el informe)
                </p>

                <div style={{ width: '260px', height: '140px', marginBottom: '12px' }}>
                  <Pie
                    data={datosGenero}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10 } },
                        datalabels: {
                          color: 'white',
                          font: { weight: 'bold', size: 9 },
                          formatter: (value, ctx) => {
                            const total = (ctx.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0)
                            return `${((value / total) * 100).toFixed(0)}%`
                          },
                        },
                        tooltip: { enabled: false },
                      },
                    }}
                  />
                </div>

                <div style={{ position: 'absolute', left: '-9999px', width: '720px', height: '240px' }}>
  <Pie
    ref={pieRef}
    data={datosGenero}
    options={{
      maintainAspectRatio: false,
      devicePixelRatio: 1,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 13 }, boxWidth: 14, padding: 10 },
        },
        datalabels: {
          color: 'white',
          font: { weight: 'bold', size: 13 },
          formatter: (value, ctx) => {
            const total = (ctx.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0)
            const pct = ((value / total) * 100).toFixed(1)
            const label = ctx.chart.data.labels?.[ctx.dataIndex]
            return `${label}\n${pct}%`
          },
        },
        tooltip: { enabled: false },
      },
    }}
  />
</div>

                <div className="flex gap-2 flex-wrap">
                  {distribucionGenero.map((item, i) => {
                    const total = distribucionGenero.reduce((a, b) => a + b.cantidad, 0)
                    const pct = total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : '0.0'
                    return (
                      <span
                        key={item.genero}
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: COLORES[i % COLORES.length] }}
                      >
                        {item.genero}: {item.cantidad} ({pct}%)
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {constructosCaptura.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">
                  Gráficos por constructo (se incluirán en el informe)
                </p>
                <div className="space-y-4">
                  {constructosCaptura.map((constructo) => {
                    const preguntas = constructo.preguntas ?? []
                    if (preguntas.length === 0) return null

                    const anchoTotal = 1080
                    const anchoEtiquetas = anchoTotal / 2

                    const chartData = {
                      labels: preguntas.map(p => wrapTextParaEtiqueta(p.pregunta, 100)),
                      datasets: [
                        {
                          label: constructo.nombre_constructo,
                          data: preguntas.map(p => p.promedio ?? 0),
                          backgroundColor: '#0a7bd7',
                          borderRadius: 5,
                        },
                      ],
                    }

                    return (
                      <div
                        key={`preview-${constructo.numero_pagina}`}
                        className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
                      >
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                          {constructo.nombre_constructo ?? `Constructo ${constructo.numero_pagina}`}
                        </p>
                        <div
                          className="mx-auto"
                          style={{ height: `${preguntas.length * 44 + 32}px`, width: `${anchoTotal}px` }}
                        >
                          <Bar
                            ref={(el) => { barrasRefs.current[constructo.numero_pagina] = el }}
                            data={chartData}
                            options={barOptions(4, true, anchoEtiquetas)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {constructosSocios.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">
                  Gráficos por dimensión — Socios (se incluirán en el informe)
                </p>
                <div className="space-y-4">
                  {constructosSocios.map((constructo) => {
                    const preguntas = constructo.preguntas ?? []
                    if (preguntas.length === 0) return null

                    const anchoTotal = 1080
                    const anchoEtiquetas = anchoTotal / 2

                    const chartData = {
                      labels: preguntas.map(p => wrapTextParaEtiqueta(p.pregunta, 100)),
                      datasets: [{
                        label: constructo.nombre_constructo,
                        data: preguntas.map(p => p.promedio ?? 0),
                        backgroundColor: '#15952f',
                        borderRadius: 5,
                      }],
                    }

                    return (
                      <div
                        key={`socio-preview-${constructo.numero_pagina}`}
                        className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
                      >
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                          {constructo.nombre_constructo ?? `Dimensión ${constructo.numero_pagina}`}
                        </p>
                        <div
                          className="mx-auto"
                          style={{ height: `${preguntas.length * 44 + 32}px`, width: `${anchoTotal}px` }}
                        >
                          <Bar
                            ref={(el) => { barrasSociosRefs.current[constructo.numero_pagina] = el }}
                            data={chartData}
                            options={barOptions(4, true, anchoEtiquetas)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {promediosSocios.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Vinculación', valor: promediosSocios[0]?.promedio_constructo },
                      { label: 'Contribución', valor: promediosSocios[1]?.promedio_constructo },
                      { label: 'Satisfacción', valor: promediosSocios[2]?.promedio_constructo },
                      { label: 'Promedio general', valor: metricasSocios?.promedio_satisfaccion_constructos },
                    ].map(({ label, valor }) => (
                      <div
                        key={label}
                        className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-3 py-2.5 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{label}</span>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: '#7f458f' }}>
                          {fmt(valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">Cargando datos...</p>
        )}
      </div>
      <button
        onClick={handleGenerar}
        disabled={generando || !carpetaConfigurada || !plantillaConfigurada || !metricas || metricas.total_encuestados === 0}
        className="w-full py-3 rounded-xl text-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={
          !carpetaConfigurada || !plantillaConfigurada || generando || !metricas || metricas.total_encuestados === 0
            ? { background: '#94a3b8', color: 'white' }
            : {
                background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})`,
                color: 'white',
              }
        }
      >
        {generando ? (
          <span className="flex items-center justify-center gap-2">
            <span className=" animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Generando informe...
          </span>
        ) : (
          'Generar informe'
        )}
      </button>

      {(!carpetaConfigurada || !plantillaConfigurada) && (
        <p className="text-lg text-center text-slate-50 dark:text-slate-300 -mt-3">
          Configura la carpeta y plantilla del informe para continuar.
        </p>
      )}
      {metricas && metricas.total_encuestados === 0 && (
        <p className="text-lg text-center text-slate-50 dark:text-slate-300 -mt-3">
          No hay respuestas para generar el informe con los filtros actuales.
        </p>
      )}

      {mostrarPopup && urlInforme && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={cerrarPopup}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl text-green-600 dark:text-green-400">✓</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
              ¡Informe generado con éxito!
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
              El documento se ha guardado correctamente en tu Google Drive.
            </p>
            <div className="flex gap-2">
              <button
                onClick={cerrarPopup}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
              <a
                href={urlInforme}
                target="_blank"
                rel="noopener noreferrer"
                onClick={cerrarPopup}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium text-center shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center"
                style={{
                  background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})`,
                }}
              >
                Ver informe
              </a>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}
