import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EstadisticasRepository } from '../estadisticas.repository';
import { ConsultaEstadisticas } from '../interfaces/consulta-estadisticas.inteface'; 
import { MAPA_FILTROS_MONGO } from '../constantes/filtros-mongo.constant';

@Injectable()
export class EstadisticasExportacionService {

  constructor(private readonly repositorio: EstadisticasRepository) {}

  @OnEvent('estadisticas.solicitar_feedback')
  async extraerFeedbackAgrupadoParaInforme(payload: { idProceso: string, filtros?: Record<string, string> }): Promise<Record<string, string>> {
    
    const queryBusqueda: ConsultaEstadisticas = { proceso_id: payload.idProceso };

    if (payload.filtros && Object.keys(payload.filtros).length > 0) {
      const filtrosValidos = Object.entries(payload.filtros).filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '');
      
      if (filtrosValidos.length > 0) {
        queryBusqueda.$and = filtrosValidos.map(([campoFrontend, valor]) => {
          const campoMapeado = MAPA_FILTROS_MONGO[campoFrontend] || campoFrontend;
          return {
            $or: [
              { [campoMapeado]: valor },
              { [campoMapeado]: 'No especificado' },
              { [campoMapeado]: 'No especificada' },
              { [campoMapeado]: { $exists: false } }
            ]
          };
        });
      }
    }

    const estadisticas = await this.repositorio.buscarPorQuery(
      queryBusqueda,
      'tipo_formulario constructos_paginas datos_respondente' 
    );

    let estFortalezas = ''; let estMejoras = '';
    let socFortalezas = ''; let socMejoras = '';
    let listaSocios = '';
    
    const esValida = (texto?: string) => texto && texto !== 'Sin respuesta' && texto.trim().length > 1;

    estadisticas.forEach(est => {
      if (est.tipo_formulario === 'socios' && est.datos_respondente) {
        const nombreSocio = est.datos_respondente.nombre || 'Nombre no especificado';
        const organizacion = est.datos_respondente.organizacion || 'Organización no especificada';
        listaSocios += `• Organización: ${organizacion} | Responsable: ${nombreSocio}\n`;
      }

      if (!est.constructos_paginas) return;

      const todasLasPreguntas = est.constructos_paginas.flatMap(
        pagina => pagina.preguntas_pagina || []
      );

      const preguntasDeTexto = todasLasPreguntas.filter(preg => preg.valor_numerico === 0);

      if (preguntasDeTexto.length === 0) return;

      const resFortaleza = preguntasDeTexto.length >= 2 ? preguntasDeTexto[preguntasDeTexto.length - 2].respuesta_texto : undefined;
      const resMejora = preguntasDeTexto[preguntasDeTexto.length - 1].respuesta_texto;

      if (est.tipo_formulario === 'estudiantes') {
        if (esValida(resFortaleza)) estFortalezas += `• ${resFortaleza!.trim()}\n\n`;
        if (esValida(resMejora)) estMejoras += `• ${resMejora!.trim()}\n\n`;
      } else if (est.tipo_formulario === 'socios') {
        if (esValida(resFortaleza)) socFortalezas += `• ${resFortaleza!.trim()}\n\n`;
        if (esValida(resMejora)) socMejoras += `• ${resMejora!.trim()}\n\n`;
      }
    });

    return {
      feedback_estudiantes_fortalezas: estFortalezas || 'No se registraron fortalezas.',
      feedback_estudiantes_mejoras: estMejoras || 'No se registraron oportunidades de mejora.',
      feedback_socios_fortalezas: socFortalezas || 'No se registraron fortalezas.',
      feedback_socios_mejoras: socMejoras || 'No se registraron oportunidades de mejora.',
      lista_socios_comunitarios: listaSocios || 'No se registraron socios comunitarios en este proceso.'
    };
  }
}