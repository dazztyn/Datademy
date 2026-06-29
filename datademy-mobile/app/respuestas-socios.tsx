import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

// Datos falsos (mocks) adaptados a una evaluación de contraparte
const sociosMock = [
  {
    id: '1',
    organizacion: 'Junta de Vecinos San Juan',
    evaluador: 'María González',
    calificacion: 'Excelente',
    comentarios: 'Los estudiantes mostraron gran disposición y el proyecto final superó nuestras expectativas.',
    fecha: '15 Nov 2026'
  }
];

export default function RespuestasSociosScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-900">
      <View className="pt-16 pb-6 px-6 bg-slate-800 rounded-b-3xl flex-row items-center shadow-lg border-b border-purple-900/30">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-3 bg-slate-700 rounded-full active:bg-slate-600">
          <Text className="text-white font-bold text-lg leading-none">{'<'}</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white" numberOfLines={1}>Evaluación Socia</Text>
          <Text className="text-purple-400 text-sm mt-0.5">Proceso de prueba 1</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {sociosMock.map(socio => (
          <View key={socio.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-2">
                <Text className="text-white font-bold text-lg">{socio.organizacion}</Text>
                <Text className="text-slate-400 text-sm mt-1">Evaluador: {socio.evaluador}</Text>
              </View>
              <View className="bg-purple-500/20 px-2.5 py-1 rounded-md border border-purple-500/30">
                <Text className="text-purple-400 text-xs font-bold">{socio.fecha}</Text>
              </View>
            </View>
            
            <View className="mb-3">
              <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">Calificación General</Text>
              <Text className="text-emerald-400 font-medium">{socio.calificacion}</Text>
            </View>

            <View className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <Text className="text-xs text-slate-500 uppercase tracking-wider mb-2">Comentarios</Text>
              <Text className="text-slate-300 text-sm leading-relaxed">"{socio.comentarios}"</Text>
            </View>
          </View>
        ))}
        <View className="h-12" />
      </ScrollView>
    </View>
  );
}