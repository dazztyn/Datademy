import { TouchableOpacity, Text } from 'react-native';

interface BotonVerDetallesProps {
  activo: boolean;
  onClick: () => void;
}

export default function BotonVerDetalles({ activo, onClick }: BotonVerDetallesProps) {
  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={!activo}
      activeOpacity={0.8}
      // Si está activo es naranja, si no, es gris oscuro
      className={`w-full mt-4 py-4 rounded-2xl flex-row items-center justify-center 
        ${activo ? 'bg-orange-500 shadow-md' : 'bg-slate-800 opacity-60'}`}
    >
      <Text className={`text-sm font-medium ${activo ? 'text-white' : 'text-slate-500'}`}>
        Ver detalles / Generar informes
      </Text>
    </TouchableOpacity>
  );
}