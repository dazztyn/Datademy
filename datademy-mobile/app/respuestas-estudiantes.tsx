import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PanelRespuestas from '../components/PanelRespuestas';

export default function RespuestasEstudiantesScreen() {
  const router = useRouter();
  const { idProceso } = useLocalSearchParams<{ idProceso: string }>();

  return (
    <View className="flex-1 bg-slate-900">
      <View className="pt-16 pb-5 px-6 bg-slate-800 rounded-b-3xl flex-row items-center shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-3 bg-slate-700 rounded-full active:bg-slate-600">
          <Text className="text-white font-bold text-lg leading-none">{'<'}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-blue-400">Respuestas Estudiantes</Text>
      </View>

      {idProceso ? (
        <PanelRespuestas idProceso={idProceso} tipo="estudiantes" colorAcento="#3b82f6" />
      ) : (
        <Text className="text-slate-400 text-center mt-10">Falta el identificador del proceso.</Text>
      )}
    </View>
  );
}