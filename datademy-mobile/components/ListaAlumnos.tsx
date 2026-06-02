import { View, Text, FlatList } from 'react-native';
import type { Alumno } from '../types/alumno';

interface ListaAlumnosProps {
  alumnos: Alumno[];
}

export default function ListaAlumnos({ alumnos }: ListaAlumnosProps) {
  if (alumnos.length === 0) {
    return (
      <View className="bg-slate-800 rounded-2xl border border-slate-700 p-8 items-center mt-4">
        <Text className="text-slate-500 text-sm">No hay alumnos con los filtros seleccionados</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={alumnos}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
      renderItem={({ item }) => (
        <View className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700 shadow-sm">
          {/* Cabecera de la tarjeta */}
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-slate-200 font-medium text-base">{item.carrera}</Text>
              <Text className="text-slate-400 text-xs">{item.sede}</Text>
            </View>
            <View className="bg-blue-900/40 px-2 py-1 rounded-md">
              <Text className="text-blue-400 text-xs font-medium">{item.nivelFormativo}</Text>
            </View>
          </View>
          
          {/* Detalles del alumno */}
          <View className="flex-row items-center gap-4 mt-2 pt-2 border-t border-slate-700">
            <View>
              <Text className="text-slate-500 text-[10px] uppercase">Edad</Text>
              <Text className="text-slate-300 text-sm">{item.edad} años</Text>
            </View>
            <View>
              <Text className="text-slate-500 text-[10px] uppercase">Género</Text>
              <Text className="text-slate-300 text-sm">{item.genero}</Text>
            </View>
          </View>
        </View>
      )}
    />
  );
}