import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface FiabilidadConstructo {
  numero_pagina: number;
  nombre_constructo: string;
  alfa_cronbach_global: number;
}

function colorParaAlfa(alfa: number) {
  if (alfa >= 0.7) return '#22c55e'; // bueno
  if (alfa >= 0.5) return '#eab308'; // aceptable
  return '#ef4444'; // bajo
}

function interpretacion(alfa: number) {
  if (alfa >= 0.9) return 'Excelente';
  if (alfa >= 0.8) return 'Bueno';
  if (alfa >= 0.7) return 'Aceptable';
  if (alfa >= 0.5) return 'Cuestionable';
  return 'Bajo';
}

export default function GraficoCronbach({ datos }: { datos: FiabilidadConstructo[] }) {
  if (!datos || datos.length === 0) return null;

  const barData = datos.map((d) => ({
    value: Number(d.alfa_cronbach_global.toFixed(2)),
    label: d.nombre_constructo.length > 10 ? d.nombre_constructo.slice(0, 10) + '…' : d.nombre_constructo,
    frontColor: colorParaAlfa(d.alfa_cronbach_global),
  }));

  return (
    <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-6">
      <BarChart
        data={barData}
        barWidth={28}
        spacing={24}
        roundedTop
        hideRules
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor="#334155"
        yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 9 }}
        noOfSections={4}
        maxValue={1}
        height={180}
        renderTooltip={(item: any) => (
          <View className="bg-slate-900 px-2 py-1 rounded-md">
            <Text className="text-white text-xs">{item.value}</Text>
          </View>
        )}
      />

      <View className="mt-4 gap-2">
        {datos.map((d) => (
          <View key={d.numero_pagina} className="flex-row justify-between items-center">
            <Text className="text-slate-300 text-xs flex-1 pr-2">{d.nombre_constructo}</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-bold text-xs">{d.alfa_cronbach_global.toFixed(2)}</Text>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colorParaAlfa(d.alfa_cronbach_global) + '30' }}
              >
                <Text className="text-[10px] font-medium" style={{ color: colorParaAlfa(d.alfa_cronbach_global) }}>
                  {interpretacion(d.alfa_cronbach_global)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Text className="text-slate-500 text-[10px] mt-3 leading-4">
        El Alfa de Cronbach mide la consistencia interna de las preguntas de cada constructo. Va de 0 a 1 — cuanto más alto, más confiable es la escala.
      </Text>
    </View>
  );
}