import { Injectable } from '@nestjs/common';
import { MapaPregunta } from './interfaces/mapa-pregunta.interface'; 
import { GoogleFormDiseno } from './interfaces/diseno-google.interface';
import { GoogleFormRespuesta, AnswerItem } from './interfaces/respuesta-google.interface'; 
import { PaginaConstructo } from './interfaces/pagina-constructo.interface';

@Injectable()
export class EstadisticasService {

  private readonly CAMPOS_DEMOGRAFICOS = [
    'nombre', 'edad', 'genero', 'nivel_formativo', 'sede', 'carrera', 'organizacion'
  ];

  private readonly diccionarioClaves: Record<string, string> = {
    'nombre': 'nombre',
    'edad': 'edad',
    'género': 'genero',
    'genero': 'genero',
    'nivel formativo': 'nivel_formativo',
    'sede': 'sede',
    'carrera': 'carrera',
    'nombre de organización': 'organizacion',
    'nombre de la organización': 'organizacion',
    'organización': 'organizacion',
    'organizacion': 'organizacion'
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
      metadatos_adicionales: new Map<string, string>()
    };
    this.CAMPOS_DEMOGRAFICOS.forEach(campo => datos[campo] = 'No especificado');

    const clavesOrdenadas = Object.keys(this.diccionarioClaves).sort((a, b) => b.length - a.length);
    
    Object.keys(respuestasUsuario)
      .filter(qId => mapaPreguntas[qId]?.pagina === 1) 
      .forEach(qId => {
        const metadata = mapaPreguntas[qId];
        const valorCrudo = respuestasUsuario[qId].textAnswers?.answers?.[0]?.value || 'Sin respuesta';
        const valorNormalizado = this.normalizarTexto(valorCrudo);
        const tituloLimpio = metadata.titulo.toLowerCase();

        const claveEncontrada = clavesOrdenadas.find(clave => tituloLimpio.includes(clave));

        if (claveEncontrada) {
          datos[this.diccionarioClaves[claveEncontrada]] = valorNormalizado;
        } else {
          datos.metadatos_adicionales.set(metadata.titulo, valorNormalizado);
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

  formatearParaFrontend(estadisticasBD: any[]) {
    return estadisticasBD.map(est => {
      const { id_respuesta_google, fecha_respuesta, datos_respondente, constructos_paginas } = est;

      const preguntasAplanadas = (constructos_paginas || []).reduce((acc: any, pagina: any) => {
        (pagina.preguestas_pagina || []).forEach((preg: any) => {
          acc[preg.pregunta] = preg.valor_numerico;
        });
        return acc;
      }, {});

      const datosBaseDinamicos = this.CAMPOS_DEMOGRAFICOS.reduce((acc, campo) => {
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

  calcularMetricasAnaliticas(estadisticasBD: any[], nombresConstructos: string[], totalEsperados: number, paginaFiltro?: number) {
    if (!estadisticasBD || estadisticasBD.length === 0) {
      return this.generarMetricasVacias(totalEsperados);
    }

    const todasLasPreguntas = this.extraerPreguntasConPagina(estadisticasBD);
    const paginasNumeros = todasLasPreguntas.map(p => p.numero_pagina);
    const ultimaPagina = paginasNumeros.length > 0 ? Math.max(...paginasNumeros) : 0;
    const preguntasConstructos = todasLasPreguntas.filter(p => p.numero_pagina < ultimaPagina);

    let constructosAProcesar = preguntasConstructos;
    if (paginaFiltro) {
      constructosAProcesar = preguntasConstructos.filter(p => p.numero_pagina === paginaFiltro);
    }

    const totalEncuestados = estadisticasBD.length;
    const tasaRespuesta = totalEsperados > 0 ? Number(((totalEncuestados / totalEsperados) * 100).toFixed(1)) : 0;

    return {
      total_esperados: totalEsperados,
      total_encuestados: estadisticasBD.length,
      tasa_respuesta_porcentaje: tasaRespuesta,
      distribucion_genero: this.calcularDistribucionGenero(estadisticasBD),

      promedios_por_pagina: this.calcularPromediosPorPagina(constructosAProcesar, nombresConstructos),
      fiabilidad_constructos: this.calcularFiabilidadCronbach(estadisticasBD, ultimaPagina, nombresConstructos, paginaFiltro),
      promedio_satisfaccion_general: this.calcularSatisfaccionGeneral(todasLasPreguntas)
    };
  }

  private normalizarTexto(texto: string): string {
    if (!texto || texto === 'Sin respuesta') return 'Sin respuesta';

    const textoLimpio = texto.trim().replace(/\s+/g, ' ');

    return textoLimpio.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }

  private mapearNombreConstructo(numeroPagina: number, nombresConstructos: string[]): string 
  {
    const indice = numeroPagina - 2;
    if (nombresConstructos && nombresConstructos[indice]) {
      return nombresConstructos[indice];
    }
    return `Constructo Página ${numeroPagina}`;
  }
  
  private generarMetricasVacias(totalEsperados: number) {
    return { 
      total_esperados: totalEsperados,
      total_encuestados: 0, 
      tasa_respuesta_porcentaje: 0,
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

  private calcularPromediosPorPagina(preguntasConPagina: any[], nombresConstructos: string[]) {
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

        const preguntas = Object.entries(preguntasData).reduce((pAcc: any, [textoPregunta, datos]: [string, any]) => {
          pAcc[textoPregunta] = Number((datos.suma / datos.cantidad).toFixed(1));
          return pAcc;
        }, {});

        const valoresPreguntas = Object.values(preguntas) as number[];
        const promedio_constructo = valoresPreguntas.length > 0 
          ? Number((valoresPreguntas.reduce((a, b) => a + b, 0) / valoresPreguntas.length).toFixed(1))
          : 0;

        return {
          numero_pagina: Number(pNum),
          nombre_constructo: this.mapearNombreConstructo(Number(pNum), nombresConstructos),
          promedio_constructo,
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

  private calcularFiabilidadCronbach(estadisticasBD: any[], ultimaPagina: number, nombresConstructos: string[], paginaFiltro?: number) {
    const resultados: any[] = [];
    const paginasMap = new Map<number, any[]>(); 

    estadisticasBD.forEach(est => {
      (est.constructos_paginas || []).forEach((pagina: any) => {
        const pNum = pagina.numero_pagina;
        
        if (pNum === ultimaPagina) return; 

        if (paginaFiltro && pNum !== paginaFiltro) return;

        if (!paginasMap.has(pNum)) paginasMap.set(pNum, []);

        const respuestasRespondente: Record<string, number> = {};
        (pagina.preguestas_pagina || []).forEach((preg: any) => {
          respuestasRespondente[preg.pregunta] = preg.valor_numerico;
        });

        paginasMap.get(pNum)!.push(respuestasRespondente);
      });
    });

    paginasMap.forEach((respondentes, pNum) => {
      const todasLasPreguntasSet = new Set<string>();
      respondentes.forEach(r => Object.keys(r).forEach(q => todasLasPreguntasSet.add(q)));
      const preguntas = Array.from(todasLasPreguntasSet);

      if (preguntas.length < 2 || respondentes.length < 2) return; 

      const alfaGlobal = this.procesarFormulaCronbach(respondentes, preguntas);

      const impactoPreguntas = preguntas.reduce((acc, pregEliminada) => {
        const preguntasRestantes = preguntas.filter(p => p !== pregEliminada);
        acc[pregEliminada] = this.procesarFormulaCronbach(respondentes, preguntasRestantes);
        return acc;
      }, {} as Record<string, number>);

      resultados.push({
        numero_pagina: pNum,
        nombre_constructo: this.mapearNombreConstructo(pNum, nombresConstructos),
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

    preguntas.forEach(preg => {
      const puntajesItem = respondentes.map(r => r[preg] || 0);
      sumaVarianzasItems += this.calcularVarianzaMuestral(puntajesItem);
    });

    const puntajesTotales = respondentes.map(r => 
      preguntas.reduce((sum, preg) => sum + (r[preg] || 0), 0)
    );
    const varianzaTotal = this.calcularVarianzaMuestral(puntajesTotales);

    if (varianzaTotal === 0) return 0;

    const alfa = (k / (k - 1)) * (1 - (sumaVarianzasItems / varianzaTotal));
    return Number(alfa.toFixed(3));
  }

  private calcularVarianzaMuestral(valores: number[]): number {
    const n = valores.length;
    if (n < 2) return 0;
    const media = valores.reduce((a, b) => a + b, 0) / n;
    const sumaCuadrados = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0);
    return sumaCuadrados / (n - 1);
  }

}
