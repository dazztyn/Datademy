import { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';

interface ModalCrearProcesoProps {
  visible: boolean;
  onCerrar: () => void;
  onCreado: () => void;
}

export default function ModalCrearProceso({ visible, onCerrar, onCreado }: ModalCrearProcesoProps) {
  const [nombre, setNombre] = useState('');
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCrear = () => {
    if (!nombre.trim()) return setError('El nombre es obligatorio');
    setGuardando(true);
    setError(null);
    
    // Simulamos la carga temporalmente mientras no conectamos a NestJS
    setTimeout(() => {
      setGuardando(false);
      onCreado();
      onCerrar();
      setNombre(''); // Limpiamos el formulario
    }, 1000);
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      {/* Fondo oscuro semi-transparente que cubre toda la pantalla */}
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        
        {/* La "Tarjeta" del Modal */}
        <View className="bg-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-700">
          <Text className="text-xl font-semibold text-slate-100 mb-5">
            Nuevo proceso
          </Text>

          {/* Input: Nombre del proceso */}
          <View className="mb-4">
            <Text className="text-xs text-slate-400 mb-1.5 ml-1">Nombre del proceso</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Proceso Informática - Semestre 2"
              placeholderTextColor="#64748b"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm"
            />
          </View>

          {/* Input: Año */}
          <View className="mb-6">
            <Text className="text-xs text-slate-400 mb-1.5 ml-1">Año</Text>
            <TextInput
              value={anio}
              onChangeText={setAnio}
              keyboardType="numeric" // <-- ¡Magia móvil aquí!
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm"
            />
          </View>

          {error && <Text className="text-red-400 text-xs mb-4 ml-1">{error}</Text>}

          {/* Botones de acción */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCerrar}
              className="flex-1 py-3 rounded-xl border border-slate-600 bg-slate-800 items-center justify-center"
            >
              <Text className="text-slate-300 text-sm font-medium">Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCrear}
              disabled={guardando}
              className={`flex-1 py-3 rounded-xl items-center justify-center ${guardando ? 'bg-orange-500/50' : 'bg-orange-500'}`}
            >
              <Text className="text-white text-sm font-medium">
                {guardando ? 'Creando...' : 'Crear'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}