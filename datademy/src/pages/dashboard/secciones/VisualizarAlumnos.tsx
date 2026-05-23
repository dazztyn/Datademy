import { useState, useMemo } from 'react'
import type { Alumno } from '../../../types/alumno'
import type { FiltrosAlumno } from '../../../types/filtrosAlumno'
import FiltrosAlumnos from '../../../components/FiltrosAlumnos'
import TablaAlumnos from '../../../components/TablaAlumnos'

const POR_PAGINA = 10

const filtrosVacios: FiltrosAlumno = {
  genero: '',
  nivelFormativo: '',
  sede: '',
  carrera: '',
}

const alumnosMock: Alumno[] = [
  { id: '1', edad: 21, genero: 'Femenino', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Ingeniería Civil' },
  { id: '2', edad: 24, genero: 'Masculino', nivelFormativo: 'Postgrado', sede: 'Antofagasta', carrera: 'Administración' },
  { id: '3', edad: 19, genero: 'Otro', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Psicología' },
  { id: '4', edad: 31, genero: 'Femenino', nivelFormativo: 'Educación continua', sede: 'Antofagasta', carrera: 'Derecho' },
  { id: '5', edad: 22, genero: 'Masculino', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Ingeniería Civil' },
]

export default function VisualizarAlumnos() {
  const [filtros, setFiltros] = useState<FiltrosAlumno>(filtrosVacios)
  const [pagina, setPagina] = useState(1)

  const carreras = useMemo(() =>
    [...new Set(alumnosMock.map(a => a.carrera))].sort()
  , [])

  const alumnosFiltrados = useMemo(() => {
    return alumnosMock.filter(a => {
      if (filtros.genero && a.genero !== filtros.genero) return false
      if (filtros.nivelFormativo && a.nivelFormativo !== filtros.nivelFormativo) return false
      if (filtros.sede && a.sede !== filtros.sede) return false
      if (filtros.carrera && a.carrera !== filtros.carrera) return false
      return true
    })
  }, [filtros])

  const totalPaginas = Math.max(1, Math.ceil(alumnosFiltrados.length / POR_PAGINA))
  const alumnosPagina = alumnosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const handleFiltros = (nuevos: FiltrosAlumno) => {
    setFiltros(nuevos)
    setPagina(1)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white drop-shadow mb-4">Alumnos</h2>
      <FiltrosAlumnos
        filtros={filtros}
        carreras={carreras}
        onChange={handleFiltros}
        onLimpiar={() => { setFiltros(filtrosVacios); setPagina(1) }}
      />
      <TablaAlumnos
        alumnos={alumnosPagina}
        pagina={pagina}
        totalPaginas={totalPaginas}
        onPagina={setPagina}
      />
    </div>
  )
}