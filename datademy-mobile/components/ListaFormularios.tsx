import { View, Text, TouchableOpacity } from 'react-native';
import SlotFormulario from './SlotFormulario';

interface Periodo {
  id: string;
  nombreProceso: string;
  anio: string;
  formularioAlumnos: string | null;
  formularioClientes: string | null;
}

interface ListaFormulariosProps {
  periodos: Periodo[];
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
  onRecargar: () => void;
}

export default function ListaFormularios({ periodos, seleccionado, onSeleccionar, onRecargar }: ListaFormulariosProps) {
  return (
    <View className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-800 mb-4">
      {periodos.map((periodo, index) => {
        const activo = seleccionado === periodo.id;
        const completo = periodo.formularioAlumnos !== null && periodo.formularioClientes !== null;
        
        // Línea separadora entre elementos (excepto el primero)
        const borderTop = index > 0 ? 'border-t border-slate-700' : '';

        return (
          <TouchableOpacity
            key={periodo.id}
            onPress={() => onSeleccionar(periodo.id)}
            activeOpacity={0.7}
            className={`px-5 py-4 ${borderTop} ${activo ? 'bg-amber-900/20' : 'bg-slate-800'}`}
          >
            {/* Fila de Título y Estado */}
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className={`font-medium text-sm ${activo ? 'text-amber-400' : 'text-slate-200'}`}>
                  {periodo.nombreProceso}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  {periodo.anio}
                </Text>
              </View>
              
              <View className="flex-row items-center gap-2">
                <View className={`px-2 py-0.5 rounded-full ${completo ? 'bg-green-900/30' : 'bg-slate-700'}`}>
                  <Text className={`text-xs ${completo ? 'text-green-400' : 'text-slate-400'}`}>
                    {completo ? 'Completo' : 'Incompleto'}
                  </Text>
                </View>
                {activo && <Text className="text-amber-400 text-lg">›</Text>}
              </View>
            </View>

            {/* Fila de los Slots (Estudiantes y Socios) */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <SlotFormulario
                  label="Estudiantes"
                  asignado={periodo.formularioAlumnos}
                  idProceso={periodo.id}
                  tipo="estudiantes"
                  onAsignado={onRecargar}
                />
              </View>
              <View className="flex-1">
                <SlotFormulario
                  label="Socios"
                  asignado={periodo.formularioClientes}
                  idProceso={periodo.id}
                  tipo="socios"
                  onAsignado={onRecargar}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}