import { useState, useEffect } from 'react';
import { listarFormularios } from '../services/formularios_service';
import { Proceso } from '../types/formulario';

export function useFormularios() {
  const [formularios, setFormularios] = useState<Proceso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = () => {
    setCargando(true);
    setError(null);
    
    listarFormularios()
      .then((res: any) => {
        const arregloReal = Array.isArray(res) ? res : (res?.procesos || res?.data || []);
        
        setFormularios(arregloReal);
      })
      .catch((err) => {
        console.error('Error:', err);
        // Forzamos a que la pantalla nos muestre el error exacto del sistema
        setError(`Fallo interno: ${err.message || JSON.stringify(err)}`); 
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const recargar = () => {
    cargarDatos();
  };

  return { formularios, cargando, error, recargar };
}