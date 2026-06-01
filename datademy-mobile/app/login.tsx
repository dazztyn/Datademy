import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = () => {
    console.log("Navegando al Dashboard...");

    router.replace('/'); 
  };

  return (
    <View className="flex-1 items-center justify-center bg-blue-900 px-4">
      <View className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm px-8 py-10 flex-col items-center border border-slate-700">

        {/* Zona de Logos temporal */}
        <View className="flex-row items-center justify-between w-full mb-8">
          <Text className="text-slate-400 font-bold">Logos aquí</Text>
        </View>

        <Text className="text-xl font-semibold text-slate-100 mb-1">
          Iniciar sesión
        </Text>
        <Text className="text-xs text-slate-500 mb-8 text-center">
          Usa tu cuenta institucional de Google
        </Text>

        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.8}
          className="w-full py-3 rounded-xl bg-blue-600 flex-row items-center justify-center shadow-sm"
        >
          <View className="w-6 h-6 bg-white rounded-full items-center justify-center mr-3">
             <Text className="font-bold text-blue-600">G</Text>
          </View>
          <Text className="text-white text-sm font-medium">
            Continuar con Google
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}