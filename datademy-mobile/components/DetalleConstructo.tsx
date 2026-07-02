import { View, Text } from 'react-native';
import type { DetalleDimension } from '../services/formularios_service';

export default function DetalleConstructo({
  constructo,
  promedioGeneral,
  colorAcento = '#3b82f6',
}: {
  constructo: DetalleDimension;
  promedioGeneral: number;
  colorAcento?: string;
}) {
  const preguntas = constructo.preguntas ?? [];
  if (preguntas.length === 0) return null;

  const masAlta = preguntas.reduce((max, p) => (p.promedio > max.promedio ? p : max));
  const masBaja = preguntas.reduce((min, p) => (p.promedio < min.promedio ? p : min));
  const maxValor = 4;

  return (
    <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-semibold text-sm flex-1 pr-2">
          {constructo.nombre_constructo}
        </Text>
        <Text className="text-xs text-slate-400">
          Prom. <Text className="font-bold" style={{ color: colorAcento }}>{promedioGeneral.toFixed(2)}</Text>
        </Text>
      </View>

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <Text className="text-emerald-400 text-[10px] font-semibold mb-1">PREGUNTA MÁS ALTA</Text>
          <Text className="text-slate-300 text-[11px] leading-4 mb-1.5" numberOfLines={3}>
            {masAlta.pregunta}
          </Text>
          <Text className="text-emerald-400 font-bold text-sm">{masAlta.promedio.toFixed(2)}</Text>
        </View>

        <View className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
          <Text className="text-rose-400 text-[10px] font-semibold mb-1">PREGUNTA MÁS BAJA</Text>
          <Text className="text-slate-300 text-[11px] leading-4 mb-1.5" numberOfLines={3}>
            {masBaja.pregunta}
          </Text>
          <Text className="text-rose-400 font-bold text-sm">{masBaja.promedio.toFixed(2)}</Text>
        </View>
      </View>

      <View className="gap-3">
        {preguntas.map((p, i) => {
          const anchoPct = Math.max((p.promedio / maxValor) * 100, 4);
          const esAlta = p.pregunta === masAlta.pregunta;
          const esBaja = p.pregunta === masBaja.pregunta;
          const colorBarra = esAlta ? '#22c55e' : esBaja ? '#f43f5e' : colorAcento;

          return (
            <View key={i}>
              <Text className="text-slate-400 text-[11px] leading-4 mb-1" numberOfLines={2}>
                {p.pregunta}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    style={{ width: `${anchoPct}%`, backgroundColor: colorBarra }}
                    className="h-full rounded-full"
                  />
                </View>
                <Text className="text-white text-xs font-bold w-8 text-right">
                  {p.promedio.toFixed(1)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}