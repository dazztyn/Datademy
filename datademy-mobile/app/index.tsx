import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import HeroBanner from '../components/HeroBanner';
import BotonVerDetalles from '../components/BotonVerDetalles';
import { useAuth } from '../context/AuthContext';
import { useFormularios } from '../hooks/useFormularios';
import { useState } from 'react';

export default function HomeScreen() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const { formularios, cargando, error, recargar } = useFormularios();

  const procesoSeleccionado = formularios.find((p) => p.idProceso === seleccionado);
  const puedeVer = !!(
    procesoSeleccionado &&
    procesoSeleccionado.formularios.formulario_estudiantes &&
    procesoSeleccionado.formularios.formulario_socios
  );

  return (
    <View className="flex-1 bg-slate-900">
      <HeroBanner nombre="" />

      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-medium text-slate-400">Procesos disponibles</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={recargar}
              className="bg-slate-700 px-3 py-1.5 rounded-full"
            >
              <Text className="text-slate-200 text-xs font-medium">Recargar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await cerrarSesion();
                router.replace('/login');
              }}
              className="bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50"
            >
              <Text className="text-red-400 text-xs font-medium">Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {cargando && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        {!cargando && error && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 items-center">
            <Text className="text-red-400 text-sm text-center mb-3">{error}</Text>
            <TouchableOpacity onPress={recargar} className="bg-red-500 px-4 py-2 rounded-xl">
              <Text className="text-white text-xs font-medium">Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!cargando && !error && formularios.length === 0 && (
          <View className="bg-slate-800 rounded-2xl border border-slate-700 p-8 items-center">
            <Text className="text-slate-500 text-sm text-center">
              Todavía no hay procesos creados. Creá uno desde la web para verlo acá.
            </Text>
          </View>
        )}

        {!cargando && !error && formularios.length > 0 && (
          <View className="flex-col gap-3 mt-2">
            {formularios.map((p) => {
              const estaSeleccionado = seleccionado === p.idProceso;
              const tieneEstudiantes = !!p.formularios.formulario_estudiantes;
              const tieneSocios = !!p.formularios.formulario_socios;

              return (
                <TouchableOpacity
                  key={p.idProceso}
                  onPress={() => setSeleccionado(p.idProceso)}
                  activeOpacity={0.7}
                  className={`p-5 rounded-2xl border ${
                    estaSeleccionado
                      ? 'bg-slate-800 border-blue-500'
                      : 'bg-slate-800/80 border-slate-700'
                  }`}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-bold text-lg flex-1 mr-2" numberOfLines={1}>
                      {p.nombreProceso}
                    </Text>
                    <View className="bg-slate-700 px-2.5 py-1 rounded-md">
                      <Text className="text-blue-400 text-xs font-bold">{p.anio}</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-4 mt-1">
                    <Text className="text-slate-400 text-sm">
                      Alumnos:{' '}
                      <Text className={tieneEstudiantes ? 'text-emerald-400' : 'text-slate-500'}>
                        {tieneEstudiantes ? 'Asignado' : 'Pendiente'}
                      </Text>
                    </Text>
                    <Text className="text-slate-400 text-sm">
                      Socio:{' '}
                      <Text className={tieneSocios ? 'text-emerald-400' : 'text-slate-500'}>
                        {tieneSocios ? 'Asignado' : 'Pendiente'}
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <BotonVerDetalles
          activo={puedeVer}
          onClick={() => {
            if (!procesoSeleccionado) return;
            router.push({
              pathname: '/detalles',
              params: {
                idProceso: procesoSeleccionado.idProceso,
                nombreProceso: procesoSeleccionado.nombreProceso,
                anio: procesoSeleccionado.anio,
              },
            });
          }}
        />

        <View className="h-12" />
      </ScrollView>
    </View>
  );
}