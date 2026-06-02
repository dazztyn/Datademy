import { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { Alumno } from '../types/alumno';
import type { FiltrosAlumno } from '../types/filtrosAlumno';
import FiltrosAlumnos from '../components/FiltrosAlumnos';
import ListaAlumnos from '../components/ListaAlumnos';

const filtrosVacios: FiltrosAlumno = {
  genero: '',
  nivelFormativo: '',
  sede: '',
  carrera: '',
};

// Tus datos de prueba
const alumnosMock: Alumno[] = [
  { id: '1', edad: 21, genero: 'Femenino', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Ingeniería Civil' },
  { id: '2', edad: 24, genero: 'Masculino', nivelFormativo: 'Postgrado', sede: 'Antofagasta', carrera: 'Administración' },
  { id: '3', edad: 19, genero: 'Otro', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Psicología' },
  { id: '4', edad: 31, genero: 'Femenino', nivelFormativo: 'Educación continua', sede: 'Antofagasta', carrera: 'Derecho' },
  { id: '5', edad: 22, genero: 'Masculino', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Ingeniería Civil' },
];

export default function VisualizarScreen() {
  const [filtros, setFiltros] = useState<FiltrosAlumno>(filtrosVacios);

  // Extraer carreras únicas para los filtros (igual que en web)
  const carreras = useMemo(() =>
    [...new Set(alumnosMock.map(a => a.carrera))].sort()
  , []);

  // Filtrar los alumnos en tiempo real
  const alumnosFiltrados = useMemo(() => {
    return alumnosMock.filter(a => {
      if (filtros.genero && a.genero !== filtros.genero) return false;
      if (filtros.nivelFormativo && a.nivelFormativo !== filtros.nivelFormativo) return false;
      if (filtros.sede && a.sede !== filtros.sede) return false;
      if (filtros.carrera && a.carrera !== filtros.carrera) return false;
      return true;
    });
  }, [filtros]);

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-12">
      <Text className="text-2xl font-semibold text-slate-100 mb-6">
        Base de datos de alumnos
      </Text>

      {/* Componente de Filtros (Chips) */}
      <FiltrosAlumnos
        filtros={filtros}
        carreras={carreras}
        onChange={setFiltros}
        onLimpiar={() => setFiltros(filtrosVacios)}
      />

      {/* Lista optimizada (Tarjetas) */}
      <ListaAlumnos alumnos={alumnosFiltrados} />
    </View>
  );
}