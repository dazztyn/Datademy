import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ToastProps {
  mensaje: string;
  tipo: 'exito' | 'error' | 'cargando';
  onCerrar: () => void;
}

export default function Toast({ mensaje, tipo, onCerrar }: ToastProps) {
  useEffect(() => {
    if (tipo === 'cargando') return;
    const timer = setTimeout(onCerrar, 3000);
    return () => clearTimeout(timer);
  }, [tipo]);

  const bgColors = {
    exito: 'bg-green-600',
    error: 'bg-red-500',
    cargando: 'bg-blue-600',
  };

  return (
    <View className={`absolute bottom-10 self-center flex-row items-center gap-3 px-5 py-3 rounded-full shadow-lg ${bgColors[tipo]} z-50`}>
      
      {tipo === 'cargando' ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text className="text-white font-bold">{tipo === 'exito' ? '✓' : '✕'}</Text>
      )}

      
      <Text className="text-white text-sm font-medium mr-2">{mensaje}</Text>

      
      {tipo !== 'cargando' && (
        <TouchableOpacity onPress={onCerrar} className="ml-2">
          <Text className="text-white/70 font-bold text-lg">×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}