import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function DetallesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-900">
      {/* Encabezado con Botón de Retroceso */}
      <View className="pt-16 pb-6 px-6 bg-slate-800 rounded-b-3xl flex-row items-center shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-3 bg-slate-700 rounded-full active:bg-slate-600">
          <Text className="text-white font-bold text-lg leading-none">{'<'}</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white" numberOfLines={1}>Detalles del Proceso</Text>
          <Text className="text-slate-400 text-sm mt-0.5">Proceso de prueba 1 • 2026</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* SECCIÓN 1: Formulario Estudiantes */}
        <View className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-5">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-blue-400">Formulario Estudiantes</Text>
              <Text className="text-slate-400 text-xs mt-1">Recolección de datos académicos</Text>
            </View>
            <View className="bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">
              <Text className="text-emerald-400 text-xs font-bold">Asignado</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/respuestas-estudiantes')} 
            className="w-full mt-4 bg-blue-600 py-3.5 rounded-xl items-center shadow-sm active:bg-blue-700"
          >
            <Text className="text-white font-semibold text-sm">Ver respuestas</Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN 2: Formulario Socia Comunitaria */}
        <View className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-8">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-purple-400">Formulario Socia</Text>
              <Text className="text-slate-400 text-xs mt-1">Evaluación de la contraparte</Text>
            </View>
            <View className="bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">
              <Text className="text-emerald-400 text-xs font-bold">Asignado</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/respuestas-socios')} 
            className="w-full mt-4 bg-purple-600 py-3.5 rounded-xl items-center shadow-sm active:bg-purple-700"
          >
            <Text className="text-white font-semibold text-sm">Ver Respuestas</Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN 3: Acciones Globales */}
        <Text className="text-sm font-semibold text-slate-400 mb-3 ml-1 uppercase tracking-wider">
          Acciones Finales
        </Text>
        
        <TouchableOpacity className="bg-orange-500 p-4 rounded-2xl items-center shadow-lg shadow-orange-500/30 active:bg-orange-600 mb-10">
          <Text className="text-white font-bold text-lg">Generar Informe</Text>
          <Text className="text-orange-100 text-xs mt-1">Consolida ambas respuestas</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}