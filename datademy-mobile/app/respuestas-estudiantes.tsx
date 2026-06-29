import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import FiltrosAlumnos from '../components/FiltrosAlumnos';
import ListaAlumnos from '../components/ListaAlumnos';
import type { FiltrosAlumno } from '../types/filtrosAlumno';
import type { Alumno } from '../types/alumno';

const filtrosVacios: FiltrosAlumno = { genero: '', nivelFormativo: '', sede: '', carrera: '' };

const alumnosMock: Alumno[] = [
  { id: '1', edad: 21, genero: 'Femenino', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Ingeniería Civil' },
  { id: '2', edad: 24, genero: 'Masculino', nivelFormativo: 'Postgrado', sede: 'Antofagasta', carrera: 'Administración' },
  { id: '3', edad: 19, genero: 'Otro', nivelFormativo: 'Pregrado', sede: 'Coquimbo', carrera: 'Psicología' },
];

export default function RespuestasEstudiantesScreen() {
  const router = useRouter();
  const [filtros, setFiltros] = useState<FiltrosAlumno>(filtrosVacios);

  const carreras = useMemo(() => [...new Set(alumnosMock.map(a => a.carrera))].sort(), []);

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
    <View className="flex-1 bg-slate-900">
      <View className="pt-16 pb-6 px-6 bg-slate-800 rounded-b-3xl flex-row items-center shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-3 bg-slate-700 rounded-full active:bg-slate-600">
          <Text className="text-white font-bold text-lg leading-none">{'<'}</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white" numberOfLines={1}>Respuestas Estudiantes</Text>
          <Text className="text-slate-400 text-sm mt-0.5">Proceso de prueba 1</Text>
        </View>
      </View>

      <View className="flex-1 px-4 pt-6">
        <FiltrosAlumnos filtros={filtros} carreras={carreras} onChange={setFiltros} onLimpiar={() => setFiltros(filtrosVacios)} />
        <ListaAlumnos alumnos={alumnosFiltrados} />
      </View>
    </View>
  );
}