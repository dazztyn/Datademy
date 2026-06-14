import { Injectable } from '@nestjs/common';
import { Estadistica } from './schemas/estadisticas.schema';
import { CAMPOS_BASE } from './config/demograficos.config';

@Injectable()
export class EstadisticasFormatterService {
  
  formatearParaFrontend(estadisticasBD: Estadistica[]) {
    return estadisticasBD.map(est => {
      const { id_respuesta_google, fecha_respuesta, datos_respondente, constructos_paginas } = est;

      const preguntasAplanadas = (constructos_paginas || []).reduce((acc: Record<string, number>, pagina: any) => {
        (pagina.preguntas_pagina || []).forEach((preg: any) => {
          acc[preg.pregunta] = preg.valor_numerico;
        });
        return acc;
      }, {});

      const datosBaseDinamicos = CAMPOS_BASE.reduce((acc, campo) => {
        acc[campo] = datos_respondente?.[campo] || 'No especificado';
        return acc;
      }, {} as Record<string, string>);

      return {
        id_respuesta: id_respuesta_google,
        fecha: fecha_respuesta,
        ...datosBaseDinamicos,
        ...(datos_respondente?.metadatos_adicionales || {}),
        ...preguntasAplanadas
      };
    });
  }
}