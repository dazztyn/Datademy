import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents'
  ],
});

export default function LoginScreen() {
  const router = useRouter();
  const { guardarTokens } = useAuth();
  const [cargando, setCargando] = useState(false);

  const iniciarSesionGoogle = async () => {
    try {
      setCargando(true);
      await GoogleSignin.hasPlayServices();
      
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // Dependiendo de la versión de la librería, el token viene en distinto nivel
      const idToken = (userInfo as any).idToken || (userInfo as any).data?.idToken;

      if (!idToken) throw new Error('No se recibió el token de identidad de Google');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      
      const response = await fetch(`${apiUrl}/auth/mobile-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al autenticar en el backend');
      }
      
      const rutaInicio: Href = '/';
      await guardarTokens(data.backendJwt, tokens.accessToken);
      router.replace(rutaInicio); 
      
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login cancelado por el usuario');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login en progreso');
      } else {
        console.error('Error en el flujo de Login:', error);
        alert(`Error al iniciar sesión: ${error.message}`);
      }
    } finally {
      setCargando(false);
    }
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
          onPress={iniciarSesionGoogle}
          disabled={cargando}
          activeOpacity={0.8}
          className="w-full py-3 rounded-xl bg-blue-600 flex-row items-center justify-center shadow-sm"
        >
          {cargando ? (
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

        {/* BOTÓN DE BYPASS PARA DESARROLLO 
        
          <TouchableOpacity
            onPress={() => {
              const rutaInicio = '/' as any;
              guardarTokens("token_de_prueba_jwt_123","token_de_prueba_google_abc");
              router.replace(rutaInicio);
            }}
            activeOpacity={0.8}
            className="w-full py-3 mt-4 rounded-xl bg-slate-700 flex-row items-center justify-center border border-slate-600"
          >
            <Text className="text-white text-sm font-medium">
              Entrar como Desarrollador
            </Text>
          </TouchableOpacity>
        */}
        
      </View>
    </View>
  );
}