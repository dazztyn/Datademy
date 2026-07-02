import { useState, useCallback, useEffect } from 'react';
import { obtenerMetricas, obtenerResultados, sincronizarManual, type Metricas } from '../services/formularios_service';

export function useEstadisticas(idProceso: string, tipo: 'estudiantes' | 'socios') {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [m, r] = await Promise.all([
        obtenerMetricas(idProceso, tipo),
        obtenerResultados(idProceso, tipo),
      ]);
      setMetricas(m);
      setRespuestas(r);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  }, [idProceso, tipo]);

  const sincronizar = useCallback(async () => {
    setSincronizando(true);
    try {
      await sincronizarManual(idProceso);
      await cargar();
    } catch (err: any) {
      setError(err.message || 'Error al sincronizar');
    } finally {
      setSincronizando(false);
    }
  }, [idProceso, cargar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { metricas, respuestas, cargando, sincronizando, error, recargar: cargar, sincronizar };
}