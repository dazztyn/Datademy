import { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import type { Plantilla } from '../types/formulario';
import { obtenerPlantillas, vincularFormulario } from '../services/formularios_service';

interface ModalAsignarFormularioProps {
  idProceso: string;
  tipoFormulario: 'estudiantes' | 'socios';
  visible: boolean;
  onCerrar: () => void;
  onAsignado: () => void;
}

export default function ModalAsignarFormulario({
  idProceso,
  tipoFormulario,
  visible,
  onCerrar,
  onAsignado,
}: ModalAsignarFormularioProps) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCargando(true);
      setError(null);
      // Como no tenemos el auth conectado aún, esto podría fallar, 
      // pero la estructura ya queda lista para cuando lo conectemos.
      obtenerPlantillas(tipoFormulario)
        .then(setPlantillas)
        .catch(() => setError('No se pudieron cargar las plantillas'))
        .finally(() => setCargando(false));
    }
  }, [visible]);

  const handleVincular = async () => {
    if (!seleccionada) return setErrorGuardar('Selecciona una plantilla');
    if (!nombre.trim()) return setErrorGuardar('Ingresa un nombre para el formulario');
    
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await vincularFormulario(idProceso, seleccionada, nombre.trim(), tipoFormulario);
      onAsignado();
      onCerrar();
      setNombre('');
      setSeleccionada(null);
    } catch {
      setErrorGuardar('Error al asignar, intenta de nuevo');
    } finally {
      setGuardando(false);
    }
  };

  const labelTipo = tipoFormulario === 'estudiantes' ? 'Estudiantes' : 'Socios';

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <View className="bg-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-700">
          
          <Text className="text-lg font-semibold text-slate-100 mb-1">
            Asignar formulario
          </Text>
          <Text className="text-xs text-slate-500 mb-4">
            Tipo: <Text className="font-medium text-slate-300">{labelTipo}</Text>
          </Text>

          {/* Lista de plantillas */}
          {cargando && (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="text-sm text-slate-500 mt-2">Cargando plantillas...</Text>
            </View>
          )}

          {error && <Text className="text-sm text-red-400 py-4 text-center">{error}</Text>}

          {!cargando && !error && (
            <ScrollView className="mb-4 max-h-48">
              {plantillas.map(plantilla => (
                <TouchableOpacity
                  key={plantilla.idPlantilla}
                  onPress={() => setSeleccionada(plantilla.idPlantilla)}
                  className={`w-full px-4 py-3 rounded-xl border mb-2 ${
                    seleccionada === plantilla.idPlantilla
                      ? 'border-amber-400 bg-amber-900/20'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  <Text className={`text-sm ${seleccionada === plantilla.idPlantilla ? 'text-amber-400 font-medium' : 'text-slate-200'}`}>
                    {plantilla.nombrePlantilla}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Nombre del formulario */}
          {!cargando && !error && (
            <View className="mb-4">
              <Text className="text-xs text-slate-400 mb-1 ml-1">Nombre del formulario</Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Encuesta estudiantes 2026"
                placeholderTextColor="#64748b"
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm"
              />
            </View>
          )}

          {errorGuardar && <Text className="text-xs text-red-400 mb-3">{errorGuardar}</Text>}

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onCerrar}
              className="flex-1 py-3 rounded-xl border border-slate-600 bg-slate-800 items-center justify-center"
            >
              <Text className="text-slate-400 text-sm font-medium">Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleVincular}
              disabled={guardando || cargando}
              className={`flex-1 py-3 rounded-xl items-center justify-center ${
                guardando || cargando ? 'bg-blue-600/50' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-sm font-medium">
                {guardando ? 'Asignando...' : 'Asignar'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}