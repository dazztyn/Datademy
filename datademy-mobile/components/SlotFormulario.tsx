import { View, Text, TouchableOpacity } from 'react-native';

interface SlotFormularioProps {
  label: string;
  asignado: string | null;
  idProceso: string;
  tipo: 'estudiantes' | 'socios';
  onAsignado: () => void;
}

export default function SlotFormulario({ label, asignado, idProceso, tipo, onAsignado }: SlotFormularioProps) {
  return (
    <View className="rounded-xl p-3 border border-slate-700 bg-slate-900">
      <Text className="text-xs text-slate-500 mb-1">{label}</Text>
      
      {asignado ? (
        // numberOfLines={1} es el equivalente nativo móvil a la clase "truncate"
        <Text className="text-sm font-medium text-slate-200" numberOfLines={1}>
          {asignado}
        </Text>
      ) : (
        <TouchableOpacity onPress={() => console.log(`Abrir modal para ${tipo}`)}>
          <Text className="text-sm text-blue-400 font-medium">+ Asignar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}