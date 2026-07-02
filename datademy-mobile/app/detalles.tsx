import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { useFormularios } from '../hooks/useFormularios';
import { obtenerInformes, type InformeGenerado } from '../services/formularios_service';

export default function DetallesScreen() {
  const router = useRouter();
  const { idProceso } = useLocalSearchParams<{ idProceso: string }>();
  const { formularios, cargando: cargandoProcesos } = useFormularios();

  const proceso = formularios.find((p) => p.idProceso === idProceso);

  const [informes, setInformes] = useState<InformeGenerado[]>([]);
  const [cargandoInformes, setCargandoInformes] = useState(true);
  const [errorInformes, setErrorInformes] = useState<string | null>(null);

  useEffect(() => {
    if (!idProceso) return;
    setCargandoInformes(true);
    setErrorInformes(null);
    obtenerInformes(idProceso)
      .then(setInformes)
      .catch((err) => setErrorInformes(err.message || 'Error al cargar informes'))
      .finally(() => setCargandoInformes(false));
  }, [idProceso]);

  if (cargandoProcesos) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!proceso) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-6">
        <Text className="text-slate-400 text-center mb-4">
          No se encontró este proceso. Puede que haya sido eliminado.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-slate-700 px-4 py-2 rounded-xl">
          <Text className="text-white text-sm">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const est = proceso.formularios.formulario_estudiantes;
  const soc = proceso.formularios.formulario_socios;

  return (
    <View className="flex-1 bg-slate-900">
      <View className="pt-16 pb-6 px-6 bg-slate-800 rounded-b-3xl flex-row items-center shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-3 bg-slate-700 rounded-full active:bg-slate-600">
          <Text className="text-white font-bold text-lg leading-none">{'<'}</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white" numberOfLines={1}>{proceso.nombreProceso}</Text>
          <Text className="text-slate-400 text-sm mt-0.5">{proceso.anio}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>

        {/* Formulario Estudiantes */}
        <View className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-5">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-blue-400">Formulario Estudiantes</Text>
              <Text className="text-slate-400 text-xs mt-1" numberOfLines={1}>
                {est ? est.nombre_formulario : 'Sin formulario asignado'}
              </Text>
            </View>
            <View className={`px-2.5 py-1 rounded-md border ${est ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-700 border-slate-600'}`}>
              <Text className={`text-xs font-bold ${est ? 'text-emerald-400' : 'text-slate-400'}`}>
                {est ? 'Asignado' : 'Pendiente'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            disabled={!est}
            onPress={() => router.push({ pathname: '/respuestas-estudiantes', params: { idProceso: proceso.idProceso } })}
            className={`w-full mt-4 py-3.5 rounded-xl items-center shadow-sm ${est ? 'bg-blue-600 active:bg-blue-700' : 'bg-slate-700 opacity-50'}`}
          >
            <Text className="text-white font-semibold text-sm">Ver respuestas</Text>
          </TouchableOpacity>
        </View>

        {/* Formulario Socios */}
        <View className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-5">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-purple-400">Formulario Socia</Text>
              <Text className="text-slate-400 text-xs mt-1" numberOfLines={1}>
                {soc ? soc.nombre_formulario : 'Sin formulario asignado'}
              </Text>
            </View>
            <View className={`px-2.5 py-1 rounded-md border ${soc ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-700 border-slate-600'}`}>
              <Text className={`text-xs font-bold ${soc ? 'text-emerald-400' : 'text-slate-400'}`}>
                {soc ? 'Asignado' : 'Pendiente'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            disabled={!soc}
            onPress={() => router.push({ pathname: '/respuestas-socios', params: { idProceso: proceso.idProceso } })}
            className={`w-full mt-4 py-3.5 rounded-xl items-center shadow-sm ${soc ? 'bg-purple-600 active:bg-purple-700' : 'bg-slate-700 opacity-50'}`}
          >
            <Text className="text-white font-semibold text-sm">Ver respuestas</Text>
          </TouchableOpacity>
        </View>

        {/* Informes generados */}
        <Text className="text-sm font-semibold text-slate-400 mb-3 ml-1 uppercase tracking-wider">
          Informes generados
        </Text>

        {cargandoInformes && (
          <View className="items-center py-6">
            <ActivityIndicator color="#3b82f6" />
          </View>
        )}

        {!cargandoInformes && errorInformes && (
          <Text className="text-red-400 text-sm mb-4">{errorInformes}</Text>
        )}

        {!cargandoInformes && !errorInformes && informes.length === 0 && (
          <View className="bg-slate-800/60 rounded-2xl border border-slate-700 p-5 mb-8">
            <Text className="text-slate-500 text-sm text-center">
              No se ha generado ningún informe para este proceso.{'\n'}Generalo desde la web Datademy.
            </Text>
          </View>
        )}

        {informes.map((inf) => (
          <TouchableOpacity
            key={inf.id_informe_drive}
            onPress={() => Linking.openURL(inf.url_descarga)}
            className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-3 flex-row items-center justify-between"
          >
            <View className="flex-1 pr-3">
              <Text className="text-white font-medium text-sm" numberOfLines={1}>{inf.nombre_informe}</Text>
              <Text className="text-slate-500 text-xs mt-1">
                {new Date(inf.fecha_generacion).toLocaleDateString()}
              </Text>
            </View>
            <Text className="text-orange-400 text-xs font-bold">Abrir ↗</Text>
          </TouchableOpacity>
        ))}

        <View className="h-12" />
      </ScrollView>
    </View>
  );
}