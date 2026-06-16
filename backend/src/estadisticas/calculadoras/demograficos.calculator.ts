import { Injectable } from '@nestjs/common';
import { Estadistica } from '../schemas/estadisticas.schema';

@Injectable()
export class DemograficosCalculator {
  calcularDistribucionGenero(estadisticasBD: Partial<Estadistica>[]) {
    const conteo = estadisticasBD.reduce((acc, est) => {
      const gen = est.datos_respondente?.['genero'] || 'No especificado';
      acc[gen] = (acc[gen] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(conteo).map(([genero, cantidad]) => ({ genero, cantidad }));
  }

  obtenerListaSociosComunitarios(estadisticasBD: Partial<Estadistica>[]) {
    const sociosMap = new Map<string, string>();
    for (const est of estadisticasBD) {
      const org = est.datos_respondente?.organizacion;
      const nombre = est.datos_respondente?.nombre;
      if (org && org !== 'No especificada' && org !== 'No especificado') {
        if (!sociosMap.has(org)) {
          sociosMap.set(org, (nombre && nombre !== 'No especificado') ? nombre : 'Anónimo');
        }
      }
    }
    return Array.from(sociosMap.entries()).map(([organizacion, nombre_responsable]) => ({
      organizacion,
      nombre_responsable
    }));
  }
}