import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import HeroBanner from '../components/HeroBanner';
import BotonVerDetalles from '../components/BotonVerDetalles';
import ModalCrearProceso from '../components/ModalCrearProceso';
import { useAuth } from '../context/AuthContext';

const mockPeriodos = [
  { 
    id: '1', 
    nombreProceso: 'Taller de Racket', 
    anio: '2026', 
    formularioAlumnos: 'Formulario Inicial V1', 
    formularioClientes: null 
  },
  { 
    id: '2', 
    nombreProceso: 'Proyecto Socia Comunitaria', 
    anio: '2026', 
    formularioAlumnos: 'Evaluación Estudiantes', 
    formularioClientes: 'Feedback Socia' 
  }
];

export default function HomeScreen() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  
  const router = useRouter();
  const { cerrarSesion } = useAuth();

  // 2. Lógica de selección adaptada a los datos mockeados
  const procesoSeleccionado = mockPeriodos.find(p => p.id === seleccionado);
  const puedeVer = !!(
    procesoSeleccionado && 
    procesoSeleccionado.formularioAlumnos !== null && 
    procesoSeleccionado.formularioClientes !== null
  );

  return (
    <View className="flex-1 bg-slate-900">
      <HeroBanner nombre="Vicente" />

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-medium text-slate-400">Procesos disponibles</Text>
          <View className="flex-row gap-2">
            {/* Botón de Cerrar Sesión operativo */}
            <TouchableOpacity 
              onPress={async () => {
                await cerrarSesion();
                router.replace('/login');
              }} 
              className="bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50"
            >
              <Text className="text-red-400 text-xs font-medium">Salir</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setModalCrearAbierto(true)} 
              className="bg-orange-500 px-3 py-1.5 rounded-full"
            >
              <Text className="text-white text-xs font-medium">+ Crear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Renderizado Directo de las Tarjetas usando mockPeriodos */}
        <View className="flex-col gap-3 mt-2">
          {mockPeriodos.map((p) => {
            const estaSeleccionado = seleccionado === p.id;

            return (
              <TouchableOpacity 
                key={p.id}
                onPress={() => setSeleccionado(p.id)}
                activeOpacity={0.7}
                className={`p-5 rounded-2xl border transition-colors ${
                  estaSeleccionado 
                    ? 'bg-slate-800 border-blue-500' 
                    : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-bold text-lg flex-1 mr-2" numberOfLines={1}>
                    {p.nombreProceso}
                  </Text>
                  <View className="bg-slate-700 px-2.5 py-1 rounded-md">
                    <Text className="text-blue-400 text-xs font-bold">{p.anio}</Text>
                  </View>
                </View>

                <View className="flex-row gap-4 mt-1">
                  <Text className="text-slate-400 text-sm">
                    Alumnos: <Text className={p.formularioAlumnos ? "text-emerald-400" : "text-slate-500"}>
                      {p.formularioAlumnos ? 'Asignado' : 'Pendiente'}
                    </Text>
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    Socio: <Text className={p.formularioClientes ? "text-emerald-400" : "text-slate-500"}>
                      {p.formularioClientes ? 'Asignado' : 'Pendiente'}
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botón flotante inferior para ver detalles */}
        <BotonVerDetalles 
          activo={puedeVer} 
          onClick={() => router.push('/detalles')} 
        />
        
        <View className="h-12" />
      </ScrollView>

      {/* Modal para crear un nuevo proceso */}
      <ModalCrearProceso 
        visible={modalCrearAbierto} 
        onCerrar={() => setModalCrearAbierto(false)} 
        onCreado={() => {
          console.log('¡Proceso creado simulado!');
          setModalCrearAbierto(false);
        }}
      />
    </View>
  );
}