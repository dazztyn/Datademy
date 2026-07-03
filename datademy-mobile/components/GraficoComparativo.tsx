import { View, Text } from 'react-native';
import type { ProcesoComparativo } from '../services/formularios_service';

const COLORES = ['#5fb7bb', '#0d438b', '#7f458f', '#f59e0b', '#22c55e', '#ef4444'];
const ESCALA_MAX = 4;

export default function GraficoComparativo({ comparativa }: { comparativa: ProcesoComparativo[] }) {
  const constructos = Array.from(
    new Set(comparativa.flatMap((p) => p.metricas.promedios_por_pagina.map((c) => c.nombre_constructo)))
  );

  if (constructos.length === 0) return null;

  return (
    <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-6">
      {/* Leyenda */}
      <View className="flex-row flex-wrap gap-3 mb-4">
        {comparativa.map((p, i) => (
          <View key={p.id_proceso} className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
            <Text className="text-slate-300 text-xs">{p.nombre_proceso} ({p.anio})</Text>
          </View>
        ))}
      </View>

      {constructos.map((nombreConstructo) => (
        <View key={nombreConstructo} className="mb-4">
          <Text className="text-slate-400 text-[11px] mb-1.5" numberOfLines={1}>{nombreConstructo}</Text>
          <View className="gap-1">
            {comparativa.map((p, i) => {
              const c = p.metricas.promedios_por_pagina.find((c) => c.nombre_constructo === nombreConstructo);
              const valor = c?.promedio_constructo ?? 0;
              const anchoPct = Math.max((valor / ESCALA_MAX) * 100, valor > 0 ? 4 : 0);
              return (
                <View key={p.id_proceso} className="flex-row items-center gap-2">
                  <View className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <View
                      style={{ width: `${anchoPct}%`, backgroundColor: COLORES[i % COLORES.length] }}
                      className="h-full rounded-full"
                    />
                  </View>
                  <Text className="text-white text-[10px] font-bold w-7 text-right">
                    {valor > 0 ? valor.toFixed(1) : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}