import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { guardarTokens } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '138085314381-vfjsktk4te6e33o2kf7nrqtthddmih52.apps.googleusercontent.com',
    // Si más adelante compilas el APK, necesitarás agregar un androidClientId aquí
  });

  useEffect(() => {
    // Si Google nos respondió con éxito y trajo un token de acceso
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        enviarTokenAlBackend(authentication.accessToken);
      }
    }
  }, [response]);

  const enviarTokenAlBackend = async (googleAccessToken: string) => {
    console.log("Token de Google obtenido, enviando a NestJS...");
    
    // Aquí es donde simulamos el guardado por ahora para engañar al guardia
    // y entrar al Dashboard. En el siguiente paso conectaremos esto al backend real.
    await guardarTokens('simulacion_jwt_123', googleAccessToken);
    
    // ¡El AuthContext se actualiza, el guardia nos ve el token y nos deja pasar!
    router.replace('/(tabs)'); 
  };

  return (
    <View className="flex-1 items-center justify-center bg-blue-900 px-4">
      <View className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm px-8 py-10 flex-col items-center border border-slate-700">

        <Text className="text-xl font-semibold text-slate-100 mb-1 mt-4">
          Iniciar sesión
        </Text>
        <Text className="text-xs text-slate-500 mb-8 text-center">
          Usa tu cuenta institucional de Google
        </Text>

        <TouchableOpacity
          onPress={() => promptAsync()}
          disabled={!request}
          activeOpacity={0.8}
          className="w-full py-3 rounded-xl bg-blue-600 flex-row items-center justify-center shadow-sm"
        >
          {/* Si request no está listo, mostramos un loader */}
          {!request ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <View className="w-6 h-6 bg-white rounded-full items-center justify-center mr-3">
                 <Text className="font-bold text-blue-600">G</Text>
              </View>
              <Text className="text-white text-sm font-medium">
                Continuar con Google
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}