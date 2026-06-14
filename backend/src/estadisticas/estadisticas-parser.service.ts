import { Injectable } from '@nestjs/common';
import { MAPEO_DEMOGRAFICO, CAMPOS_BASE } from './config/demograficos.config';
import { GoogleFormDiseno } from './interfaces/diseno-google.interface';
import { GoogleFormRespuesta, AnswerItem } from './interfaces/respuesta-google.interface';
import { MapaPregunta } from './interfaces/mapa-pregunta.interface';
import { PaginaTemp } from './interfaces/pagina-temp.interface';

@Injectable()
export class EstadisticasParserService {

  procesarEncuesta(
    disenoCrudo: GoogleFormDiseno,   
    respuestaCruda: GoogleFormRespuesta,
    idRespuesta: string, 
    usuarioId: string, 
    procesoId: string
  ) {
    const respuestasUsuario = respuestaCruda.answers;
    const mapaPreguntas = this.construirMapaPreguntas(disenoCrudo);
    const datosRespondente = this.extraerDatosPersonales(respuestasUsuario, mapaPreguntas);
    const constructosFinales = this.procesarConstructos(respuestasUsuario, mapaPreguntas);
    const fechaRespondida = respuestaCruda.createTime ? new Date(respuestaCruda.createTime) : new Date();

    return {
      id_respuesta_google: idRespuesta,
      fecha_respuesta: fechaRespondida,
      proceso_id: procesoId,
      usuario_id: usuarioId,
      datos_respondente: datosRespondente,
      constructos_paginas: constructosFinales
    };
  }

  private extraerDatosPersonales(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) {
    const metadatosExtra = new Map<string, string>();
    const datos: Record<string, string | Map<string, string>> = { 
      metadatos_adicionales: metadatosExtra
    };
    
    CAMPOS_BASE.forEach(campo => datos[campo] = 'No especificado');

    Object.keys(respuestasUsuario)
      .filter(qId => mapaPreguntas[qId]?.pagina === 1) 
      .forEach(qId => {
        const metadata = mapaPreguntas[qId];
        const valorCrudo = respuestasUsuario[qId].textAnswers?.answers?.[0]?.value || 'Sin respuesta';
        const valorNormalizado = this.normalizarTexto(valorCrudo);
        const tituloLimpio = metadata.titulo.toLowerCase();

        let campoEncontrado;
        for (const [campoInterno, aliasArray] of Object.entries(MAPEO_DEMOGRAFICO)) {
          if (aliasArray.some(alias => tituloLimpio.includes(alias))) {
            campoEncontrado = campoInterno;
            break;
          }
        }

        if (campoEncontrado) {
          datos[campoEncontrado] = valorNormalizado;
        } else {
          metadatosExtra.set(metadata.titulo, valorNormalizado);
        }
      });

    return datos;
  }

  private construirMapaPreguntas(disenoCrudo: GoogleFormDiseno): Record<string, MapaPregunta> {
    let paginaActual = 1;
    let ordenGlobal = 0;
    return (disenoCrudo.items || []).reduce((mapa, item) => {
      if (item.pageBreakItem) paginaActual++;
      if (item.questionItem) {
        const qId = item.questionItem.question.questionId;
        const opciones = item.questionItem.question.choiceQuestion?.options.map(opt => opt.value) || [];
        mapa[qId] = { pagina: paginaActual, titulo: item.title || 'Sin título', opciones, orden: ++ordenGlobal };
      }
      return mapa;
    }, {} as Record<string, MapaPregunta>);
  }

  private procesarConstructos(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) {
    const paginas = Object.keys(respuestasUsuario)
      .filter(qId => mapaPreguntas[qId]?.pagina > 1)
      .reduce<Record<number, PaginaTemp>>((acc, qId) => {
        const metadata = mapaPreguntas[qId];
        const valor = respuestasUsuario[qId].textAnswers?.answers?.[0]?.value || 'Sin respuesta';
        const puntaje = metadata.opciones.indexOf(valor) + 1;

        if (!acc[metadata.pagina]) acc[metadata.pagina] = { numero_pagina: metadata.pagina, preguntas: [] };
        acc[metadata.pagina].preguntas.push({
          pregunta: metadata.titulo, respuesta_texto: valor, valor_numerico: puntaje, orden: metadata.orden
        });
        return acc;
      }, {});

    return Object.values(paginas).map(p => ({
      numero_pagina: p.numero_pagina,
      preguntas_pagina: p.preguntas
        .sort((a, b) => a.orden - b.orden) 
        .map(({ orden, ...preguntaLimpia }) => preguntaLimpia)
    }));
  }

  private normalizarTexto(texto: string): string {
    if (!texto || texto === 'Sin respuesta') return 'Sin respuesta';
    const textoLimpio = texto.trim().replace(/\s+/g, ' ');
    return textoLimpio.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  }
}