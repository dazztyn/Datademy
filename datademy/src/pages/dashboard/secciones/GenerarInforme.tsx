import { useState, useRef } from 'react'
import { useProceso } from '../../../context/ProcesoContext'
import { useMetricas } from '../../../hooks/useMetricas'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useToast } from '../../../hooks/useToast'
import { configurarReportes } from '../../../services/informes_service'
import Toast from '../../../components/Toast'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { temasPagina, temaDefault } from '../../../utils/temasPagina'
import { useLocation } from 'react-router-dom'
import { useGooglePicker } from '../../../hooks/useGooglePicker'

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels)
const COLORES = ['#5fb7bb', '#0d438b', '#7f458f']

const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  }
}

export default function GenerarInforme() {
  const { idProceso } = useProceso()
  const { metricas } = useMetricas(idProceso, { tipo: 'estudiantes' })
  const { toast, mostrar, cerrar } = useToast()
  const location = useLocation()
  const tema = temasPagina[location.pathname] ?? temaDefault
  const pieRef = useRef<ChartJS<'pie'> | null>(null)

  const [asignatura, setAsignatura] = useState('')
  const [modulo, setModulo] = useState('')
  const [carrera, setCarrera] = useState('')
  const [programa, setPrograma] = useState('')
  const [mesInicio, setMesInicio] = useState('')
  const [mesFinal, setMesFinal] = useState('')
  const [anio, setAnio] = useState(String(new Date().getFullYear()))
  
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [ciudad, setCiudad] = useState('')

  const [tipoAsignatura, setTipoAsignatura] = useState<'Obligatoria' | 'Electiva'>('Obligatoria')
  const [ciclo, setCiclo] = useState<'Básico' | 'Profesional'>('Básico')
  const [numSemestre, setNumSemestre] = useState('')
  const [pronombre, setPronombre] = useState<'el' | 'la'>('el')
  const [nombreDocente, setNombreDocente] = useState('')
  const [carpetaConfigurada, setCarpetaConfigurada] = useState(false)
  const [plantillaConfigurada, setPlantillaConfigurada] = useState(false)
  const [generando, setGenerando] = useState(false)

  const totalEstudiantes = metricas?.total_esperados ?? 0
    const totalRespuestas = metricas?.total_encuestados ?? 0
    const porcRespuestas = metricas?.tasa_respuesta_porcentaje.toFixed(1) ?? '0'
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
  }
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
  }
})
    const datosGenero = metricas ? {
      labels: metricas.distribucion_genero.map(d => d.genero),
      datasets: [{
        data: metricas.distribucion_genero.map(d => d.cantidad),
        backgroundColor: COLORES,
        borderWidth: 0,
      }]
    } : null

  const handleGenerar = async () => {
    if (!idProceso) return
    if (!asignatura || !carrera || !nombreUsuario || !ciudad || !numSemestre || !nombreDocente) {
      return mostrar('Por favor completa todos los campos obligatorios', 'error')
    }

    setGenerando(true)
    mostrar('Generando informe...', 'cargando')

    try {
      let graficos: Record<string, string> = {}
      if (pieRef.current) {
        const base64 = pieRef.current.toBase64Image()
        graficos['GraficoGenero'] = base64
      }

      const datosTexto: Record<string, string> = {
        AsignaturaModulo: `${asignatura} - ${modulo}`.trim(),
        CarreraPrograma: `${carrera} - ${programa}`.trim(),
        Periodo: `${mesInicio}-${mesFinal} / ${anio}`,
        Anio: anio,
        NombreUsuario: nombreUsuario,
        Ciudad: ciudad,
        ToggleAsignatura: tipoAsignatura,
        ToggleCiclo: ciclo,
        NumSemestre: numSemestre,
        TogglePronombre: pronombre,
        NombreDocente: nombreDocente,
        TotalEstudiantes: String(totalEstudiantes),
        TotalRespuestas: String(totalRespuestas),
        PorcRespuestas: `${porcRespuestas}%`,
      }

      const response = await fetch(`${BASE_URL}/reportes/generar`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          nombreCarrera: carrera,
          datosTexto,
          graficos,
        }),
      })

      if (!response.ok) throw new Error('Error al generar informe')
      const data = await response.json()
      mostrar('Informe generado correctamente', 'exito')
      if (data.url_informe) window.open(data.url_informe, '_blank')
    } catch {
      mostrar('Error al generar el informe, intenta de nuevo', 'error')
    } finally {
      setGenerando(false)
    }
  }

  if (!idProceso) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/70 text-sm">No hay proceso seleccionado. Vuelve al inicio y selecciona uno.</p>
      </div>
    )
  }

  const inputClass = "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
  const labelClass = "text-xs text-slate-500 dark:text-slate-400 mb-1 block"
  const seccionClass = "bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4"
  const tituloSeccion = "text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3"

  const Toggle = ({ valor, opcion1, opcion2, onChange }: {
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
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200
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

  return (
    <div className="space-y-6 w-full">
        <div className={seccionClass}>
  <h3 className={tituloSeccion}>Configuración del informe</h3>
  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
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
    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Carpeta destino</p>
    <p className={`text-xs ${carpetaConfigurada ? 'text-green-500' : 'text-slate-400'}`}>
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
    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Plantilla del informe</p>
    <p className={`text-xs ${plantillaConfigurada ? 'text-green-500' : 'text-slate-400'}`}>
      {plantillaConfigurada ? '✓ Configurada' : 'Seleccionar en Drive'}
    </p>
  </div>
</button>
  </div>
</div>
      <div className={seccionClass}>
        <h3 className={tituloSeccion}>Datos generales</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Asignatura</label>
            <input type="text" value={asignatura} onChange={e => setAsignatura(e.target.value)} placeholder="Ej: Ingeniería de Software" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Módulo</label>
            <input type="text" value={modulo} onChange={e => setModulo(e.target.value)} placeholder="Ej: Módulo 1" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Carrera</label>
            <input type="text" value={carrera} onChange={e => setCarrera(e.target.value)} placeholder="Ej: Ingeniería Civil" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Programa</label>
            <input type="text" value={programa} onChange={e => setPrograma(e.target.value)} placeholder="Ej: Pregrado" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Período</label>
          <div className="grid grid-cols-3 gap-2">
            <input type="text" value={mesInicio} onChange={e => setMesInicio(e.target.value)} placeholder="Mes inicio" className={inputClass} />
            <input type="text" value={mesFinal} onChange={e => setMesFinal(e.target.value)} placeholder="Mes final" className={inputClass} />
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
            <label className={labelClass}>Ciudad</label>
            <input type="text" value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ej: Coquimbo" className={inputClass} />
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
        {metricas ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Total estudiantes</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{totalEstudiantes}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Total respuestas</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{totalRespuestas}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">% respuestas</p>
                <p className="text-2xl font-bold" style={{ color: tema.sidebar }}>{porcRespuestas}%</p>
              </div>
            </div>
           {datosGenero && (
  <div>
    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
      Gráfico de género (se incluirá en el informe)
    </p>
    <div style={{ width: '380px', height: '260px', margin: '20px' }}>
      <Pie
        ref={pieRef}
        data={datosGenero}
        options={{
          maintainAspectRatio: false,
          devicePixelRatio: 3,
          plugins: {
            legend: { position: 'right' },
            datalabels: {
              color: 'white',
              font: { weight: 'bold', size: 13 },
              formatter: (value, ctx) => {
                const total = (ctx.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0)
                const pct = ((value / total) * 100).toFixed(1)
                const label = ctx.chart.data.labels?.[ctx.dataIndex]
                return `${label}\n${pct}%`
              }
            },
            tooltip: { enabled: false }
          }
        }}
      />
    </div>
    <div className="flex gap-2 flex-wrap">
      {metricas.distribucion_genero.map((item, i) => {
        const total = metricas.distribucion_genero.reduce((a, b) => a + b.cantidad, 0)
        const pct = ((item.cantidad / total) * 100).toFixed(1)
        return (
          <span key={item.genero} className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: COLORES[i % COLORES.length] }}>
            {item.genero}: {item.cantidad} ({pct}%)
          </span>
        )
      })}
    </div>
  </div>
)}
          </div>
        ) : (
          <p className="text-xs text-slate-400 animate-pulse">Cargando datos...</p>
        )}
      </div>

      <button
        onClick={handleGenerar}
        disabled={generando || !carpetaConfigurada || !plantillaConfigurada}
        className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={(!carpetaConfigurada || !plantillaConfigurada || generando)
          ? { background: '#94a3b8', color: 'white' }
          : { background: `linear-gradient(to right, ${tema.fondoDesde}, ${tema.fondoHasta})`, color: 'white' }
        }
      >
        {generando ? 'Generando...' : 'Generar informe'}
      </button>

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}