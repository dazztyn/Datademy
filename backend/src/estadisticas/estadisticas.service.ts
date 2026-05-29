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

    let todasLasPreguntas = this.extraerPreguntasConPagina(estadisticasBD);

    if (paginaFiltro) {
      todasLasPreguntas = todasLasPreguntas.filter(p => p.numero_pagina === paginaFiltro);
    }

    return {
      total_encuestados: estadisticasBD.length,
      distribucion_genero: this.calcularDistribucionGenero(estadisticasBD),
      promedios_por_pagina: this.calcularPromediosPorPagina(todasLasPreguntas),
      promedio_satisfaccion_general: this.calcularSatisfaccionGeneral(todasLasPreguntas),
      // NUEVO: Análisis psicométrico avanzado
      fiabilidad_constructos: this.calcularFiabilidadCronbach(estadisticasBD, paginaFiltro)
    };
  }

  // FUNCIONES AUXILIARES REFACTORIZADAS Y AVANZADAS
  
  private generarMetricasVacias() {
    return { 
      total_encuestados: 0, 
      distribucion_genero: {}, 
      promedios_por_pagina: [], 
      promedio_satisfaccion_general: 0,
      fiabilidad_constructos: []
    };
  }

  private extraerPreguntasConPagina(estadisticasBD: any[]) {
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
    const acumulador = preguntasConPagina.reduce((acc: any, preg: any) => {
      const pNum = preg.numero_pagina;
      
      if (!acc[pNum]) acc[pNum] = {};
      if (!acc[pNum][preg.pregunta]) acc[pNum][preg.pregunta] = { suma: 0, cantidad: 0 };

      acc[pNum][preg.pregunta].suma += preg.valor_numerico;
      acc[pNum][preg.pregunta].cantidad++;
      return acc;
    }, {});

    return Object.entries(acumulador)
      .map(([pNum, preguntasData]: [string, any]) => {
        // 1. Calculamos el promedio de cada pregunta individual
        const preguntas = Object.entries(preguntasData).reduce((pAcc: any, [textoPregunta, datos]: [string, any]) => {
          pAcc[textoPregunta] = Number((datos.suma / datos.cantidad).toFixed(1));
          return pAcc;
        }, {});

        // 2. Calculamos el promedio global del constructo
        const valoresPreguntas = Object.values(preguntas) as number[];
        const promedio_constructo = valoresPreguntas.length > 0 
          ? Number((valoresPreguntas.reduce((a, b) => a + b, 0) / valoresPreguntas.length).toFixed(1))
          : 0;

        return {
          numero_pagina: Number(pNum),
          promedio_constructo, // Se inyecta aquí para el frontend
          preguntas
        };
      })
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

  // MOTOR PSICOMÉTRICO: ALFA DE CRONBACH

  private calcularFiabilidadCronbach(estadisticasBD: any[], paginaFiltro?: number) {
    const resultados: any[] = [];
    const paginasMap = new Map<number, any[]>(); 

    // 1. Agrupamos las respuestas por página y por encuestado
    estadisticasBD.forEach(est => {
      (est.constructos_paginas || []).forEach((pagina: any) => {
        const pNum = pagina.numero_pagina;
        if (paginaFiltro && pNum !== paginaFiltro) return;

        if (!paginasMap.has(pNum)) paginasMap.set(pNum, []);

        const respuestasRespondente: Record<string, number> = {};
        (pagina.preguestas_pagina || []).forEach((preg: any) => {
          respuestasRespondente[preg.pregunta] = preg.valor_numerico;
        });

        paginasMap.get(pNum)!.push(respuestasRespondente);
      });
    });

    // 2. Calculamos el Alfa para cada constructo
    paginasMap.forEach((respondentes, pNum) => {
      // Obtenemos todas las preguntas únicas de este constructo
      const todasLasPreguntasSet = new Set<string>();
      respondentes.forEach(r => Object.keys(r).forEach(q => todasLasPreguntasSet.add(q)));
      const preguntas = Array.from(todasLasPreguntasSet);

      // El Alfa de Cronbach exige mínimo 2 preguntas y 2 encuestados
      if (preguntas.length < 2 || respondentes.length < 2) return; 

      const alfaGlobal = this.procesarFormulaCronbach(respondentes, preguntas);

      // Calculamos "Alfa si se elimina el elemento" para saber la relevancia de cada pregunta
      const impactoPreguntas = preguntas.reduce((acc, pregEliminada) => {
        const preguntasRestantes = preguntas.filter(p => p !== pregEliminada);
        acc[pregEliminada] = this.procesarFormulaCronbach(respondentes, preguntasRestantes);
        return acc;
      }, {} as Record<string, number>);

      resultados.push({
        numero_pagina: pNum,
        alfa_cronbach_global: alfaGlobal,
        alfa_si_se_elimina_pregunta: impactoPreguntas
      });
    });

    return resultados.sort((a, b) => a.numero_pagina - b.numero_pagina);
  }

  private procesarFormulaCronbach(respondentes: any[], preguntas: string[]): number {
    const k = preguntas.length;
    if (k < 2) return 0;

    let sumaVarianzasItems = 0;

    // Varianza de cada pregunta individual
    preguntas.forEach(preg => {
      const puntajesItem = respondentes.map(r => r[preg] || 0);
      sumaVarianzasItems += this.calcularVarianzaMuestral(puntajesItem);
    });

    // Varianza de la suma total del constructo
    const puntajesTotales = respondentes.map(r => 
      preguntas.reduce((sum, preg) => sum + (r[preg] || 0), 0)
    );
    const varianzaTotal = this.calcularVarianzaMuestral(puntajesTotales);

    if (varianzaTotal === 0) return 0; // Previene divisiones por cero si todos responden lo mismo

    const alfa = (k / (k - 1)) * (1 - (sumaVarianzasItems / varianzaTotal));
    return Number(alfa.toFixed(3)); // Retorna con 3 decimales (estándar académico)
  }

  private calcularVarianzaMuestral(valores: number[]): number {
    const n = valores.length;
    if (n < 2) return 0;
    const media = valores.reduce((a, b) => a + b, 0) / n;
    const sumaCuadrados = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0);
    return sumaCuadrados / (n - 1);
  }

}
