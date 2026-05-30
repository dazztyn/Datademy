import { View } from 'react-native';
// Asegúrate de que la ruta sea correcta. 
// Si tu index está dentro de (tabs), la ruta será '../../components/HeroBanner'
import HeroBanner from '../../components/HeroBanner'; 

export default function HomeScreen() {
  return (
    // Contenedor principal que ocupa toda la pantalla (flex-1) con un fondo claro
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      
      {/* ¡Aquí llamamos a tu bloque de Lego! */}
      <HeroBanner nombre="Vicente" />

    </View>
  );
}