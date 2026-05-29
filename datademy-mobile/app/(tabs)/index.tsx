import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    // Reemplazamos el <div> por <View>
    <View className="flex-1 items-center justify-center bg-slate-900">
      
      {/* Reemplazamos el <h1> por <Text> */}
      <Text className="text-3xl font-bold text-blue-400 mb-2">
        ¡NativeWind Funciona! 🎉
      </Text>
      
      {/* Reemplazamos el <p> por <Text> */}
      <Text className="text-base text-slate-400">
        Preparando Datademy Móvil...
      </Text>

    </View>
  );
}