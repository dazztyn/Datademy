import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useFormularios } from '../hooks/useFormularios';
import { obtenerComparativaGlobal, type ProcesoComparativo } from '../services/formularios_service';
import GraficoComparativo from '../components/GraficoComparativo';

const COLORES = ['#5fb7bb', '#0d438b', '#7f458f', '#f59e0b', '#22c55e', '#ef4444'];

export default function DatosGlobalesScreen() {
  const router = useRouter();
  const { formularios, cargando: cargandoProcesos } = useFormularios();
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [tipo, setTipo] = useState<'estudiantes' | 'socios'>('estudiantes');
  const [comparativa, setComparativa] = useState<ProcesoComparativo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
      return nuevo;
    });
  };

  const comparar = async () => {
    if (seleccionados.size === 0) return;
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerComparativaGlobal(tipo, [...seleccionados]);
      setComparativa(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo obtener la comparativa');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <View className="pt-16 pb-5 px-6 bg-slate-800 rounded-b-3xl flex-row items-center shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-3 bg-slate-700 rounded-full active:bg-slate-600">
          <Text className="text-white font-bold text-lg leading-none">{'<'}</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-emerald-400">Datos Globales</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Toggle tipo */}
        <View className="flex-row bg-slate-800 rounded-xl p-1 mt-5 mb-4">
          {(['estudiantes', 'socios'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => { setTipo(t); setComparativa([]); }}
              className={`flex-1 py-2 rounded-lg items-center ${tipo === t ? 'bg-emerald-600' : ''}`}
            >
              <Text className={`text-xs font-medium capitalize ${tipo === t ? 'text-white' : 'text-slate-400'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selector de procesos */}
        <Text className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Selecciona procesos ({seleccionados.size})
        </Text>

        {cargandoProcesos ? (
          <ActivityIndicator color="#22c55e" className="my-4" />
        ) : (
          <View className="bg-slate-800 rounded-2xl border border-slate-700 mb-4 overflow-hidden">
            {formularios.map((f, i) => (
              <TouchableOpacity
                key={f.idProceso}
                onPress={() => toggle(f.idProceso)}
                className={`flex-row items-center px-4 py-3 ${i < formularios.length - 1 ? 'border-b border-slate-700' : ''}`}
              >
                <View
                  className={`w-5 h-5 rounded-md border-2 mr-3 items-center justify-center ${
                    seleccionados.has(f.idProceso) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}
                >
                  {seleccionados.has(f.idProceso) && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-medium">{f.nombreProceso}</Text>
                  <Text className="text-slate-500 text-xs">{f.anio}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={comparar}
          disabled={seleccionados.size === 0 || cargando}
          className={`py-3.5 rounded-xl items-center mb-6 ${seleccionados.size === 0 ? 'bg-slate-700 opacity-50' : 'bg-emerald-600 active:bg-emerald-700'}`}
        >
          <Text className="text-white font-semibold text-sm">{cargando ? 'Comparando...' : 'Comparar'}</Text>
        </TouchableOpacity>

        {error && <Text className="text-red-400 text-sm text-center mb-4">{error}</Text>}

        {comparativa.length > 0 && !cargando && (
          <>
            {/* Cards resumen */}
            <FlatList
              data={comparativa}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id_proceso}
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              renderItem={({ item: p, index: i }) => (
                <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 w-40">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
                    <Text className="text-slate-300 text-xs flex-1" numberOfLines={1}>{p.nombre_proceso}</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">{p.metricas.promedio_satisfaccion_general.toFixed(1)}</Text>
                  <Text className="text-slate-500 text-[10px] mb-1">satisfacción general</Text>
                  {p.variacion_satisfaccion_respecto_anterior !== null && (
                    <Text className={`text-xs font-medium ${p.variacion_satisfaccion_respecto_anterior >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.variacion_satisfaccion_respecto_anterior >= 0 ? '↑' : '↓'} {Math.abs(p.variacion_satisfaccion_respecto_anterior).toFixed(2)} vs anterior
                    </Text>
                  )}
                  <Text className="text-slate-500 text-[10px] mt-1">{p.metricas.total_encuestados} encuestados</Text>
                </View>
              )}
            />

            <Text className="text-sm font-semibold text-slate-400 mb-3 mt-2 uppercase tracking-wider">
              Comparativa por constructo
            </Text>
            <GraficoComparativo comparativa={comparativa} />

            {comparativa.some((p) => p.variaciones_constructos.length > 0) && (
              <>
                <Text className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  Variaciones respecto al proceso anterior
                </Text>
                {comparativa.filter((p) => p.variaciones_constructos.length > 0).map((p, i) => (
                  <View key={p.id_proceso} className="mb-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
                      <Text className="text-slate-400 text-xs font-medium">{p.nombre_proceso}</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {p.variaciones_constructos.map((v) => (
                        <View key={v.nombre_constructo} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-row items-center gap-2">
                          <Text className="text-slate-400 text-[10px]" numberOfLines={1}>{v.nombre_constructo}</Text>
                          {v.variacion_respecto_anterior !== null && (
                            <Text className={`text-[10px] font-bold ${v.variacion_respecto_anterior >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {v.variacion_respecto_anterior >= 0 ? '↑' : '↓'} {Math.abs(v.variacion_respecto_anterior).toFixed(2)}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <View className="h-12" />
      </ScrollView>
    </View>
  );
}