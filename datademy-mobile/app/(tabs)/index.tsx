import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import HeroBanner from '../../components/HeroBanner';
import BotonVerDetalles from '../../components/BotonVerDetalles';
import ListaFormularios from '../../components/ListaFormularios';
import ModalCrearProceso from '../../components/ModalCrearProceso';
import { useRouter } from 'expo-router';

// Datos de prueba temporales
const mockPeriodos = [
  { id: '1', nombreProceso: 'Taller de Racket', anio: '2026', formularioAlumnos: 'Formulario Inicial V1', formularioClientes: null },
  { id: '2', nombreProceso: 'Proyecto Socia Comunitaria', anio: '2026', formularioAlumnos: 'Evaluación Estudiantes', formularioClientes: 'Feedback Socia' }
];

export default function HomeScreen() {
  // Estado para saber cuál tocaste
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const router = useRouter();

  // Se activa el botón naranja si tocas el proceso que tiene ambos formularios listos
  const procesoSeleccionado = mockPeriodos.find(p => p.id === seleccionado);
  const puedeVer = !!(procesoSeleccionado && procesoSeleccionado.formularioAlumnos && procesoSeleccionado.formularioClientes);

  return (
    <View className="flex-1 bg-slate-900">
      <HeroBanner nombre="Vicente" />

      <ScrollView className="flex-1 px-4 pt-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-medium text-slate-400">Procesos disponibles</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity className="bg-blue-600 px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-medium">Plantillas</Text>
            </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setModalCrearAbierto(true)} 
            className="bg-orange-500 px-3 py-1.5 rounded-full">
          <Text className="text-white text-xs font-medium">+ Crear</Text>
        </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.replace('/login')} className="bg-red-500 p-3 m-4 rounded-xl">
        <Text className="text-white text-center">Ir al Login (Test)</Text>
        </TouchableOpacity>

        {/* ¡Reemplazamos la caja negra por tu nueva lista! */}
        <ListaFormularios 
          periodos={mockPeriodos}
          seleccionado={seleccionado}
          onSeleccionar={setSeleccionado}
          onRecargar={() => console.log('Recargar lista')}
        />

        <BotonVerDetalles 
          activo={puedeVer} 
          onClick={() => router.push('/visualizar')} 
        />
        <View className="h-12" />
      </ScrollView>
      <ModalCrearProceso 
      visible={modalCrearAbierto} 
      onCerrar={() => setModalCrearAbierto(false)} 
      onCreado={() => console.log('¡Proceso creado simulado!')} 
    />
    </View>
  );
}