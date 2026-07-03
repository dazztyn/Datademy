import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useEstadisticas } from '../hooks/useEstadisticas';
import GraficoCronbach from './GraficoCronbach';
import GraficoGenero from './GraficoGenero';
import DetalleConstructo from './DetalleConstructo';

const CAMPOS_BASE = ['nombre', 'edad', 'genero', 'nivel_formativo', 'sede', 'carrera', 'organizacion', 'asignatura'];

export default function PanelRespuestas({
  idProceso,
  tipo,
  colorAcento = '#3b82f6',
}: {
  idProceso: string;
  tipo: 'estudiantes' | 'socios';
  colorAcento?: string;
}) {
  const { metricas, respuestas, cargando, sincronizando, error, recargar, sincronizar } = useEstadisticas(idProceso, tipo);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colorAcento} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 items-center mx-5">
        <Text className="text-red-400 text-sm text-center mb-3">{error}</Text>
        <TouchableOpacity onPress={recargar} className="bg-red-500 px-4 py-2 rounded-xl">
          <Text className="text-white text-xs font-medium">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-5"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={sincronizando} onRefresh={sincronizar} tintColor={colorAcento} />}
    >
      {/* Resumen */}
      <View className="flex-row gap-3 mt-5 mb-2">
        <View className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-4 items-center">
          <Text className="text-2xl font-bold text-white">{metricas?.total_encuestados ?? 0}</Text>
          <Text className="text-slate-400 text-xs mt-1 text-center">Respuestas{'\n'}({metricas?.total_esperados ?? 0} esperadas)</Text>
        </View>
        <View className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-4 items-center">
          <Text className="text-2xl font-bold text-white">{metricas?.tasa_respuesta_porcentaje ?? 0}%</Text>
          <Text className="text-slate-400 text-xs mt-1 text-center">Tasa de{'\n'}respuesta</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-5">
        <View className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-4 items-center">
          <Text className="text-2xl font-bold" style={{ color: colorAcento }}>
            {metricas?.promedio_satisfaccion_general ?? 0}
          </Text>
          <Text className="text-slate-400 text-xs mt-1 text-center">Satisfacción{'\n'}general</Text>
        </View>
        <View className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 p-4 items-center">
          <Text className="text-2xl font-bold text-white">
            {metricas?.nps_satisfaccion ? metricas.nps_satisfaccion.score_nps : '—'}
          </Text>
          <Text className="text-slate-400 text-xs mt-1 text-center">Score{'\n'}NPS</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={sincronizar}
        disabled={sincronizando}
        className="bg-slate-700 py-3 rounded-xl items-center mb-6 flex-row justify-center gap-2"
      >
        {sincronizando && <ActivityIndicator size="small" color="#fff" />}
        <Text className="text-white text-sm font-medium">
          {sincronizando ? 'Sincronizando...' : 'Sincronizar con Google Forms'}
        </Text>
      </TouchableOpacity>

      {/* Promedios por constructo */}
      {!!metricas?.promedios_por_pagina?.length && (
        <>
          <Text className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            Promedio por constructo
          </Text>
          <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-6">
            {metricas.promedios_por_pagina.map((c, i) => (
              <View
                key={c.nombre_constructo}
                className={`flex-row justify-between items-center py-2.5 ${
                  i < metricas.promedios_por_pagina.length - 1 ? 'border-b border-slate-700' : ''
                }`}
              >
                <Text className="text-slate-300 text-sm flex-1 pr-3">{c.nombre_constructo}</Text>
                <Text className="text-white font-bold text-sm">{c.promedio_constructo}</Text>
              </View>
            ))}
          </View>
        </>
      )}

    {!!metricas?.distribucion_genero?.length && (
    <>
        <Text className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
        Distribución por género
        </Text>
        <GraficoGenero datos={metricas.distribucion_genero} />
    </>
    )}

    {tipo === 'estudiantes' && !!(metricas as any)?.fiabilidad_constructos?.length && (
    <>
        <Text className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
        Fiabilidad (Alfa de Cronbach)
        </Text>
        <GraficoCronbach datos={(metricas as any).fiabilidad_constructos} />
    </>
    )}

    {!!metricas?.detalle_por_dimension?.length && (
    <>
        <Text className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
        Detalle por pregunta
        </Text>
        {metricas.detalle_por_dimension
        .slice(0, -1) // igual que en la web: se excluye la última página (es la de NPS, no un constructo real)
        .map((c) => {
            const promedioDelConstructo =
            metricas.promedios_por_pagina.find((p) => p.nombre_constructo === c.nombre_constructo)
                ?.promedio_constructo ?? 0;
            return (
            <DetalleConstructo
                key={c.numero_pagina}
                constructo={c}
                promedioGeneral={promedioDelConstructo}
                colorAcento={colorAcento}
                />
             );
            })}
        </>
        )}

      {/* Listado de respuestas */}
      <Text className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
        Respuestas individuales ({respuestas.length})
      </Text>

      {respuestas.length === 0 && (
        <View className="bg-slate-800/60 rounded-2xl border border-slate-700 p-5 mb-8">
          <Text className="text-slate-500 text-sm text-center">
            Todavía no hay respuestas registradas para este formulario.
          </Text>
        </View>
      )}

      {respuestas.map((r) => {
        const id = r.id_respuesta ?? JSON.stringify(r.fecha);
        const abierto = expandidoId === id;
        const detalle = Object.entries(r).filter(([k]) => k !== 'id_respuesta' && k !== 'fecha' && !CAMPOS_BASE.includes(k));

        return (
          <TouchableOpacity
            key={id}
            onPress={() => setExpandidoId(abierto ? null : id)}
            activeOpacity={0.8}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-3"
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-medium text-sm flex-1 pr-2" numberOfLines={1}>
                {r.nombre !== 'No especificado' ? r.nombre : r.organizacion !== 'No especificado' ? r.organizacion : 'Respuesta anónima'}
              </Text>
              <Text className="text-slate-500 text-xs">
                {r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}
              </Text>
            </View>

            {abierto && (
              <View className="mt-3 pt-3 border-t border-slate-700">
                {detalle.map(([k, v]) => (
                  <View key={k} className="mb-2">
                    <Text className="text-slate-500 text-xs">{k}</Text>
                    <Text className="text-slate-200 text-sm">{String(v)}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text className="text-xs mt-2" style={{ color: colorAcento }}>
              {abierto ? 'Ocultar detalle ▲' : 'Ver detalle ▼'}
            </Text>
          </TouchableOpacity>
        );
      })}

      <View className="h-12" />
    </ScrollView>
  );
}