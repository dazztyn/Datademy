import { Injectable } from '@nestjs/common';
import { MapaPregunta } from './interfaces/mapa-pregunta.interface'; 
import { GoogleFormDiseno } from './interfaces/diseno-google.interface';
import { GoogleFormRespuesta, AnswerItem } from './interfaces/respuesta-google.interface'; 
import { Estadistica } from './schemas/estadisticas.schema';
import { PreguntaAplanada } from './interfaces/pregunta-aplanada.interface';
import { PaginaTemp } from './interfaces/pagina-temp.interface';
import { EstadisticasMathService } from './estadisticas-math.service';


@Injectable()
export class EstadisticasService {

  constructor(private readonly mathService: EstadisticasMathService) {}

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

  private readonly clavesOrdenadas = Object.keys(this.diccionarioClaves).sort((a, b) => b.length - a.length);

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

  private extraerDatosPersonales(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) 
  {
    const metadatosExtra = new Map<string, string>();

    const datos: Record<string, string | Map<string, string>> = { 
      metadatos_adicionales: metadatosExtra
    };
    
    this.CAMPOS_DEMOGRAFICOS.forEach(campo => datos[campo] = 'No especificado');

    Object.keys(respuestasUsuario)
      .filter(qId => mapaPreguntas[qId]?.pagina === 1) 
      .forEach(qId => {
        const metadata = mapaPreguntas[qId];
        const valorCrudo = respuestasUsuario[qId].textAnswers?.answers?.[0]?.value || 'Sin respuesta';
        const valorNormalizado = this.normalizarTexto(valorCrudo);
        const tituloLimpio = metadata.titulo.toLowerCase();

        const claveEncontrada = this.clavesOrdenadas.find(clave => tituloLimpio.includes(clave));

        if (claveEncontrada) {
          datos[this.diccionarioClaves[claveEncontrada]] = valorNormalizado;
        } else {
          metadatosExtra.set(metadata.titulo, valorNormalizado);
        }
      });

        return datos;
  }
  // private extraerDatosPersonales(respuestasUsuario: Record<string, AnswerItem>, mapaPreguntas: Record<string, MapaPregunta>) {
    
  //   const datos: Record<string, any> = { 
  //     metadatos_adicionales: new Map<string, string>()
  //   };
  //   this.CAMPOS_DEMOGRAFICOS.forEach(campo => datos[campo] = 'No especificado');
    
  //   Object.keys(respuestasUsuario)
  //     .filter(qId => mapaPreguntas[qId]?.pagina === 1) 
  //     .forEach(qId => {
  //       const metadata = mapaPreguntas[qId];
  //       const valorCrudo = respuestasUsuario[qId].textAnswers?.answers?.[0]?.value || 'Sin respuesta';
  //       const valorNormalizado = this.normalizarTexto(valorCrudo);
  //       const tituloLimpio = metadata.titulo.toLowerCase();

  //       const claveEncontrada = this.clavesOrdenadas.find(clave => tituloLimpio.includes(clave));

  //       if (claveEncontrada) {
  //         datos[this.diccionarioClaves[claveEncontrada]] = valorNormalizado;
  //       } else {
  //         datos.metadatos_adicionales.set(metadata.titulo, valorNormalizado);
  //       }
  //     });

  //   return datos;
  // }

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

  formatearParaFrontend(estadisticasBD: Estadistica[]) {
    return estadisticasBD.map(est => {
      const { id_respuesta_google, fecha_respuesta, datos_respondente, constructos_paginas } = est;

      const preguntasAplanadas = (constructos_paginas || []).reduce((acc: Record<string, number>, pagina) => {
        (pagina.preguntas_pagina || []).forEach((preg) => {
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

  calcularMetricasAnaliticas(estadisticasBD: Partial<Estadistica>[], nombresConstructos: string[], totalEsperados: number, paginaFiltro?: number) {
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
      promedio_satisfaccion_general: this.calcularSatisfaccionGeneral(todasLasPreguntas),
      fiabilidad_constructos: this.mathService.calcularFiabilidadCronbach(
        estadisticasBD, 
        ultimaPagina, 
        nombresConstructos, 
        this.mapearNombreConstructo.bind(this),
        paginaFiltro
      )
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

  private extraerPreguntasConPagina(estadisticasBD: Partial<Estadistica>[]) {
    return estadisticasBD.flatMap(est => 
      (est.constructos_paginas || []).flatMap((pagina) => 
        (pagina.preguntas_pagina || []).map((preg) => ({
          ...preg,
          numero_pagina: pagina.numero_pagina
        }))
      )
    );
  }

  private calcularDistribucionGenero(estadisticasBD: Partial<Estadistica>[]) {
    return estadisticasBD.reduce((acc, est) => {
      const genero = est.datos_respondente?.genero || 'No especificado';
      acc[genero] = (acc[genero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calcularPromediosPorPagina(preguntasConPagina: PreguntaAplanada[], nombresConstructos: string[]) {
    const acumulador = preguntasConPagina.reduce((acc: Record<number, Record<string, { suma: number; cantidad: number }>>, preg) => {
      const pNum = preg.numero_pagina;
      
      if (!acc[pNum]) acc[pNum] = {};
      if (!acc[pNum][preg.pregunta]) acc[pNum][preg.pregunta] = { suma: 0, cantidad: 0 };

      acc[pNum][preg.pregunta].suma += preg.valor_numerico;
      acc[pNum][preg.pregunta].cantidad++;
      return acc;
    }, {});

    return Object.entries(acumulador)
      .map(([pNum, preguntasData]) => {

        const preguntas = Object.entries(preguntasData).reduce((pAcc: Record<string, number>, [textoPregunta, datos]) => {
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

  private calcularSatisfaccionGeneral(preguntasConPagina: PreguntaAplanada[]) {
    const preguntasSatisfaccion = preguntasConPagina.filter(preg => 
      preg.pregunta.toLowerCase().includes('satisfacción general') || 
      preg.pregunta.toLowerCase().includes('satisfaccion general')
    );

    if (preguntasSatisfaccion.length === 0) return 0;

    const suma = preguntasSatisfaccion.reduce((acc, preg) => acc + preg.valor_numerico, 0);
    return Number((suma / preguntasSatisfaccion.length).toFixed(1));
  }

}
