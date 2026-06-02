import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { FiltrosAlumno } from '../types/filtrosAlumno';
import type { Genero, NivelFormativo, Sede } from '../types/alumno';

interface FiltrosAlumnosProps {
  filtros: FiltrosAlumno;
  carreras: string[];
  onChange: (filtros: FiltrosAlumno) => void;
  onLimpiar: () => void;
}

// Componente auxiliar para renderizar los "Chips" (Píldoras)
const FiltroChip = ({ activo, label, onPress }: { activo: boolean, label: string, onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-1.5 rounded-full border mr-2 ${
      activo ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-600'
    }`}
  >
    <Text className={`text-xs ${activo ? 'text-white font-medium' : 'text-slate-400'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function FiltrosAlumnos({ filtros, carreras, onChange, onLimpiar }: FiltrosAlumnosProps) {
  const update = (campo: keyof FiltrosAlumno, valor: string) => onChange({ ...filtros, [campo]: valor });

  return (
    <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-2">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-sm font-medium text-slate-300">Filtros</Text>
        <TouchableOpacity onPress={onLimpiar}>
          <Text className="text-xs text-orange-400 font-medium">Limpiar</Text>
        </TouchableOpacity>
      </View>

      {/* Filtro: Sede */}
      <Text className="text-[10px] text-slate-500 uppercase mb-2">Sede</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <FiltroChip activo={filtros.sede === ''} label="Todas" onPress={() => update('sede', '')} />
        <FiltroChip activo={filtros.sede === 'Coquimbo'} label="Coquimbo" onPress={() => update('sede', 'Coquimbo')} />
        <FiltroChip activo={filtros.sede === 'Antofagasta'} label="Antofagasta" onPress={() => update('sede', 'Antofagasta')} />
      </ScrollView>

      {/* Filtro: Nivel Formativo */}
      <Text className="text-[10px] text-slate-500 uppercase mb-2">Nivel Formativo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <FiltroChip activo={filtros.nivelFormativo === ''} label="Todos" onPress={() => update('nivelFormativo', '')} />
        <FiltroChip activo={filtros.nivelFormativo === 'Pregrado'} label="Pregrado" onPress={() => update('nivelFormativo', 'Pregrado')} />
        <FiltroChip activo={filtros.nivelFormativo === 'Postgrado'} label="Postgrado" onPress={() => update('nivelFormativo', 'Postgrado')} />
        <FiltroChip activo={filtros.nivelFormativo === 'Educación continua'} label="Continua" onPress={() => update('nivelFormativo', 'Educación continua')} />
      </ScrollView>
    </View>
  );
}