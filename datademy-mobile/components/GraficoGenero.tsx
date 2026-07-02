import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

const COLORES = ['#3b82f6', '#a855f7', '#f97316', '#22c55e', '#eab308'];

export default function GraficoGenero({ datos }: { datos: { genero: string; cantidad: number }[] }) {
  if (!datos || datos.length === 0) return null;

  const total = datos.reduce((acc, d) => acc + d.cantidad, 0);
  const pieData = datos.map((d, i) => ({
    value: d.cantidad,
    color: COLORES[i % COLORES.length],
    text: `${Math.round((d.cantidad / total) * 100)}%`,
  }));

  return (
    <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-6 items-center">
      <PieChart
        data={pieData}
        donut
        radius={70}
        innerRadius={45}
        innerCircleColor="#1e293b"
        centerLabelComponent={() => (
          <View className="items-center">
            <Text className="text-white font-bold text-lg">{total}</Text>
            <Text className="text-slate-400 text-[10px]">total</Text>
          </View>
        )}
        textColor="white"
        textSize={11}
      />

      <View className="flex-row flex-wrap justify-center gap-3 mt-4">
        {datos.map((d, i) => (
          <View key={d.genero} className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
            <Text className="text-slate-300 text-xs">{d.genero} ({d.cantidad})</Text>
          </View>
        ))}
      </View>
    </View>
  );
}