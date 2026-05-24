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

  private extraerDatosPersonales(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) {
    const datos: Record<string, any> = { 
      edad: 'No especificada', genero: 'No especificado', nivel_formativo: 'No especificado', 
      sede: 'No especificada', carrera: 'No especificada', metadatos_adicionales: new Map<string, string>()
    };

    Object.keys(respuestasUsuario)
      .filter(qId => mapaPreguntas[qId]?.pagina === 1) 
      .forEach(qId => {
        const metadata = mapaPreguntas[qId];
        const valor = respuestasUsuario[qId].textAnswers?.answers?.[0]?.value || 'Sin respuesta';
        const tituloLimpio = metadata.titulo.toLowerCase();

        const claveEncontrada = Object.keys(this.diccionarioClaves).find(clave => tituloLimpio.includes(clave));

        if (claveEncontrada) {
          datos[this.diccionarioClaves[claveEncontrada]] = valor;
        } else {
          datos.metadatos_adicionales.set(metadata.titulo, valor);
        }
      });

    return datos;
  }

  private procesarConstructos(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) {
    
    const paginas = Object.keys(respuestasUsuario)
      .filter(qId => mapaPreguntas[qId]?.pagina > 1)
      .reduce((acc, qId) => {
        const metadata = mapaPreguntas[qId];
        const valor = respuestasUsuario[qId].textAnswers?.answers?.[0]?.value || 'Sin respuesta';
        const puntaje = metadata.opciones.indexOf(valor) + 1;

        if (!acc[metadata.pagina]) acc[metadata.pagina] = { numero_pagina: metadata.pagina, preguntas: [] };

        acc[metadata.pagina].preguntas.push({
          pregunta: metadata.titulo, respuesta_texto: valor, valor_numerico: puntaje, orden: metadata.orden
        });

        return acc;
      }, {} as Record<number, any>);

    return Object.values(paginas).map((p: any) => ({
      numero_pagina: p.numero_pagina,
      preguestas_pagina: p.preguntas
        .sort((a: any, b: any) => a.orden - b.orden) 
        .map(({ orden, ...preguntaLimpia }: any) => preguntaLimpia)
    }));
  }

  /**
   * Aplasta los documentos JSON de MongoDB en un formato plano perfecto para las tablas del Frontend.
   */
  formatearParaFrontend(estadisticasBD: any[]) {
    return estadisticasBD.map(est => {
      const { id_respuesta_google, fecha_respuesta, datos_respondente, constructos_paginas } = est;

      const preguntasAplanadas = (constructos_paginas || []).reduce((acc: any, pagina: any) => {
        (pagina.preguestas_pagina || []).forEach((preg: any) => {
          acc[preg.pregunta] = preg.valor_numerico;
        });
        return acc;
      }, {});

      return {
        id_respuesta: id_respuesta_google,
        fecha: fecha_respuesta,
        edad: datos_respondente?.edad || 'No especificada',
        genero: datos_respondente?.genero || 'No especificado',
        nivel_formativo: datos_respondente?.nivel_formativo || 'No especificado',
        sede: datos_respondente?.sede || 'No especificada',
        carrera: datos_respondente?.carrera || 'No especificada',
        
        ...(datos_respondente?.metadatos_adicionales || {}),
        
        ...preguntasAplanadas
      };
    });
  }

  /**
   * Procesa matemáticamente la colección de encuestas agrupando promedios por constructos (páginas).
   */
  calcularMetricasAnaliticas(estadisticasBD: any[], paginaFiltro?: number) {
    if (!estadisticasBD || estadisticasBD.length === 0) {
      return this.generarMetricasVacias();
    }

    // Paso 1: Extraemos todas las preguntas conservando la asociación a su página
    let todasLasPreguntas = this.extraerPreguntasConPagina(estadisticasBD);

    // Paso 2: Si el frontend solicitó una página específica, filtramos la lista antes de procesar
    if (paginaFiltro) {
      todasLasPreguntas = todasLasPreguntas.filter(p => p.numero_pagina === paginaFiltro);
    }

    // Paso 3: Coordinación de cálculos limpios (Single Responsibility Principle)
    return {
      total_encuestados: estadisticasBD.length,
      distribucion_genero: this.calcularDistribucionGenero(estadisticasBD),
      promedios_por_pagina: this.calcularPromediosPorPagina(todasLasPreguntas),
      promedio_satisfaccion_general: this.calcularSatisfaccionGeneral(todasLasPreguntas)
    };
  }

  // ==========================================================
  // FUNCIONES AUXILIARES REFACTORIZADAS
  // ==========================================================

  private generarMetricasVacias() {
    return { total_encuestados: 0, distribucion_genero: {}, promedios_por_pagina: [], promedio_satisfaccion_general: 0 };
  }

  private extraerPreguntasConPagina(estadisticasBD: any[]) {
    // Usamos .flatMap() para aplanar, pero inyectamos el numero_pagina en cada pregunta para no perder el constructo
    return estadisticasBD.flatMap(est => 
      (est.constructos_paginas || []).flatMap((pagina: any) => 
        (pagina.preguestas_pagina || []).map((preg: any) => ({
          ...preg,
          numero_pagina: pagina.numero_pagina
        }))
      )
    );
  }

  private calcularDistribucionGenero(estadisticasBD: any[]) {
    return estadisticasBD.reduce((acc, est) => {
      const genero = est.datos_respondente?.genero || 'No especificado';
      acc[genero] = (acc[genero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calcularPromediosPorPagina(preguntasConPagina: any[]) {
    // 1. Agrupamos acumuladores
    const acumulador = preguntasConPagina.reduce((acc: any, preg: any) => {
      const pNum = preg.numero_pagina;
      
      if (!acc[pNum]) acc[pNum] = {};
      if (!acc[pNum][preg.pregunta]) acc[pNum][preg.pregunta] = { suma: 0, cantidad: 0 };

      acc[pNum][preg.pregunta].suma += preg.valor_numerico;
      acc[pNum][preg.pregunta].cantidad++;
      return acc;
    }, {});

    // 2. Transformamos y ordenamos
    return Object.entries(acumulador)
      // FIX 1: Le decimos explícitamente a TypeScript los tipos que vienen del entries
      .map(([pNum, preguntasData]: [string, any]) => ({
        numero_pagina: Number(pNum),
        preguntas: Object.entries(preguntasData).reduce((pAcc: any, [textoPregunta, datos]: [string, any]) => {
          pAcc[textoPregunta] = Number((datos.suma / datos.cantidad).toFixed(1));
          return pAcc;
        }, {})
      }))
      .sort((a, b) => a.numero_pagina - b.numero_pagina); 
  }

  private calcularSatisfaccionGeneral(preguntasConPagina: any[]) {
    const preguntasSatisfaccion = preguntasConPagina.filter(preg => 
      preg.pregunta.toLowerCase().includes('satisfacción general') || 
      preg.pregunta.toLowerCase().includes('satisfaccion general')
    );

    if (preguntasSatisfaccion.length === 0) return 0;

    const suma = preguntasSatisfaccion.reduce((acc, preg) => acc + preg.valor_numerico, 0);
    return Number((suma / preguntasSatisfaccion.length).toFixed(1));
  }

}
