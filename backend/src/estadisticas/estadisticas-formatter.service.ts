import { Injectable } from '@nestjs/common';
import { Estadistica } from './schemas/estadisticas.schema';
import { CAMPOS_BASE } from './config/demograficos.config';
import { PaginaConstructo, RespuestaPregunta } from './interfaces/pagina-constructo.interface';

@Injectable()
export class EstadisticasFormatterService {
  
  formatearParaFrontend(estadisticasBD: Estadistica[]) {
    return estadisticasBD.map(est => {
      const { id_respuesta_google, fecha_respuesta, datos_respondente, constructos_paginas } = est;

      const preguntasAplanadas = (constructos_paginas || []).reduce((acc: Record<string, number | string>, pagina: PaginaConstructo) => {
        (pagina.preguntas_pagina || []).forEach((preg: RespuestaPregunta) => {
          acc[preg.pregunta] = preg.valor_numerico > 0 ? preg.valor_numerico : preg.respuesta_texto;         
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