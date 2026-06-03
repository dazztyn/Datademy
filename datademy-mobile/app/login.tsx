import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { guardarTokens } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    //androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: 'https://auth.expo.io/@dazztyn/datademy-mobile',
  });

  useEffect(() => {
    if (request) {
      console.log("=== DEBUG GOOGLE AUTH ===");
      console.log("La URL exacta de redirección es:", request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        enviarTokenAlBackend(authentication.accessToken);
      }
    }
  }, [response]);

  const enviarTokenAlBackend = async (googleAccessToken: string) => {
    console.log("Token de Google obtenido, enviando a NestJS...");
    await guardarTokens('simulacion_jwt_123', googleAccessToken);
    router.replace('/(tabs)'); 
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 px-4">
      <View className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm px-8 py-10 flex-col items-center border border-slate-700">

      {/* Zona de Logos Institucionales */}
        <View className="flex-row items-center justify-center w-full mb-6">
          <Image 
            source={require('../assets/images/LOGODIDEC.png')}
            style={{ width: 100, height: 60, marginRight: 20 }}
            resizeMode="contain"
          />
          
          <Image 
            source={require('../assets/images/logo-ucn.png')} 
            style={{ width: 85, height: 85 }} 
            resizeMode="contain"
          />
        </View>

        <Text className="text-xl font-semibold text-slate-100 mb-1 mt-2 text-center w-full">
          Iniciar sesión
        </Text>

        <Text className="text-xs text-slate-500 mb-8 text-center w-full">
          Usa tu cuenta institucional de Google
        </Text>

        <TouchableOpacity
          onPress={() => promptAsync()}
          disabled={!request}
          activeOpacity={0.8}
          className="w-full py-3 rounded-xl bg-blue-600 flex-row items-center justify-center shadow-sm"
        >
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