import { Injectable } from '@nestjs/common';
import { MapaPregunta } from './interfaces/mapa-pregunta.interface'; 
import { GoogleFormDiseno } from './interfaces/diseno-google.interface';
import { GoogleFormRespuesta, AnswerItem } from './interfaces/respuesta-google.interface'; 
import { PaginaConstructo } from './interfaces/pagina-constructo.interface';

@Injectable()
export class EstadisticasService {

  private readonly diccionarioClaves: Record<string, string> = {
    'edad': 'edad',
    'género': 'genero',
    'genero': 'genero',
    'nivel formativo': 'nivel_formativo',
    'sede': 'sede',
    'carrera': 'carrera'
  };

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

  private construirMapaPreguntas(disenoCrudo: GoogleFormDiseno): Record<string, MapaPregunta> {
    const mapa: Record<string, MapaPregunta> = {};
    let paginaActual = 1;

    if (!disenoCrudo.items) return mapa;

    for (const item of disenoCrudo.items) {
      if (item.pageBreakItem) paginaActual++;
      
      if (item.questionItem && item.questionItem.question.choiceQuestion) {
        const qId = item.questionItem.question.questionId;
        const opciones = item.questionItem.question.choiceQuestion.options.map(opt => opt.value);

        mapa[qId] = { pagina: paginaActual, titulo: item.title || 'Sin título', opciones };
      }
    }
    return mapa;
  }

  private extraerDatosPersonales(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) 
  {
    const datos: Record<string, any> = { 
      edad: 'No especificada', 
      genero: 'No especificado',
      nivel_formativo: 'No especificado',
      sede: 'No especificada',
      carrera: 'No especificada',
      metadatos_adicionales: new Map<string, string>()
    };

    for (const qId in respuestasUsuario) {
      const metadata = mapaPreguntas[qId];
      
      if (metadata && metadata.pagina === 1) {
        let valorRespondido = 'Sin respuesta';
        if (respuestasUsuario[qId].textAnswers?.answers[0]) {
          valorRespondido = respuestasUsuario[qId].textAnswers.answers[0].value;
        }

        const tituloLimpio = metadata.titulo.toLowerCase();
        let esCampoBase = false;
        
        for (const [palabraClave, propiedadDestino] of Object.entries(this.diccionarioClaves)) {
          if (tituloLimpio.includes(palabraClave)) {
            datos[propiedadDestino] = valorRespondido;
            esCampoBase = true;
            break; 
          }
        }

        if (!esCampoBase) {
          datos.metadatos_adicionales.set(metadata.titulo, valorRespondido);
        }
      }
    }
    
    return datos;
  }

  private procesarConstructos(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) {
    const paginasAgrupadas: Record<number, PaginaConstructo> = {}; 

    for (const qId in respuestasUsuario) {
      const metadata = mapaPreguntas[qId];
      
      if (metadata && metadata.pagina > 1) {
        const nPagina = metadata.pagina;
        const valorRespondido = respuestasUsuario[qId].textAnswers.answers[0].value;

        if (!paginasAgrupadas[nPagina]) {
          paginasAgrupadas[nPagina] = 
          { 
            numero_pagina: nPagina, 
            preguestas_pagina: [] 
          };
        }

        const indiceRespuesta = metadata.opciones.indexOf(valorRespondido);
        const puntajeNumerico = indiceRespuesta !== -1 ? indiceRespuesta + 1 : 0;

        paginasAgrupadas[nPagina].preguestas_pagina.push({
          pregunta: metadata.titulo,
          respuesta_texto: valorRespondido,
          valor_numerico: puntajeNumerico
        });
      }
    }
    return Object.values(paginasAgrupadas);
  }
}
