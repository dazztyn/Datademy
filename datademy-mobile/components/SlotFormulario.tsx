import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import ModalAsignarFormulario from './ModalAsignarFormulario';

interface SlotFormularioProps {
  label: string;
  asignado: string | null;
  idProceso: string;
  tipo: 'estudiantes' | 'socios';
  onAsignado: () => void;
}

export default function SlotFormulario({ label, asignado, idProceso, tipo, onAsignado }: SlotFormularioProps) {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
      <View className="rounded-xl p-3 border border-slate-700 bg-slate-900">
        <Text className="text-xs text-slate-500 mb-1">{label}</Text>
        
        {asignado ? (
          <Text className="text-sm font-medium text-slate-200" numberOfLines={1}>
            {asignado}
          </Text>
        ) : (
          <TouchableOpacity onPress={() => setModalAbierto(true)}>
            <Text className="text-sm text-blue-400 font-medium">+ Asignar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ModalAsignarFormulario
        idProceso={idProceso}
        tipoFormulario={tipo}
        visible={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onAsignado={onAsignado}
      />
    </>
  );
}