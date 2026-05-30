import { View, Text, Image } from 'react-native';

interface HeroBannerProps {
  nombre: string
}

export default function HeroBanner({ nombre }: HeroBannerProps) {
  return (
    <View className="w-full bg-blue-900" style={{ minHeight: 200 }}>
      
      {/* Redujimos un poco el padding horizontal (px-4) */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-16">
        
        {/* Logo Izquierdo: Ligeramente más pequeños (h-10 w-16) */}
        <Image 
          source={require('../assets/images/LOGODIDEC.png')} 
          className="h-10 w-16" 
          resizeMode="contain" 
          style={{ tintColor: 'white' }} 
        />

        {/* Textos Centrales: Agregamos flex-1 y px-2 para que no choque */}
        <View className="flex-1 flex-col items-center px-2">
          {/* Redujimos el texto a text-xl y forzamos el centrado */}
          <Text className="text-xl font-semibold text-white text-center">
            Bienvenid@ <Text className="text-white/70">{nombre}</Text>
          </Text>
          
          <Text className="text-white/60 text-xs mt-1 text-center">
            Por favor seleccione un formulario
          </Text>
        </View>

        {/* Logo Derecho: Ligeramente más pequeños */}
        <Image 
          source={require('../assets/images/LOGOA+S.png')} 
          className="h-10 w-16" 
          resizeMode="contain" 
          style={{ tintColor: 'white' }} 
        />
        
      </View>
    </View>
  )
}