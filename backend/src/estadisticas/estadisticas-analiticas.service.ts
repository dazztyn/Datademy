import { Injectable } from '@nestjs/common';
import { Estadistica } from './schemas/estadisticas.schema';
import { EstadisticasMathService } from './estadisticas-math.service';
import { PreguntaAplanada } from './interfaces/pregunta-aplanada.interface';

@Injectable()
export class EstadisticasAnaliticasService 
{
  constructor(private readonly mathService: EstadisticasMathService) {}

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

    const promediosPorPagina = this.calcularPromediosPorPagina(constructosAProcesar, nombresConstructos);

    const promedioSatisfaccionConstructos = promediosPorPagina.length > 0 
      ? Number((promediosPorPagina.reduce((acc, p) => acc + p.promedio_constructo, 0) / promediosPorPagina.length).toFixed(1)) 
      : 0;
    
    return {
      total_esperados: totalEsperados,
      total_encuestados: estadisticasBD.length,
      tasa_respuesta_porcentaje: tasaRespuesta,
      distribucion_genero: this.calcularDistribucionGenero(estadisticasBD),
      promedios_por_pagina: this.calcularPromediosPorPagina(constructosAProcesar, nombresConstructos),
      promedio_satisfaccion_constructos: promedioSatisfaccionConstructos,
      promedio_satisfaccion_general: this.calcularSatisfaccionGeneral(todasLasPreguntas),
      satisfaccion_por_carrera: this.calcularSatisfaccionPorAtributo(estadisticasBD, ultimaPagina, 'carrera'),
      satisfaccion_por_sede: this.calcularSatisfaccionPorAtributo(estadisticasBD, ultimaPagina, 'sede'),
      satisfaccion_por_organizacion: this.calcularSatisfaccionPorAtributo(estadisticasBD, ultimaPagina, 'organizacion'),
      ranking_preguntas: this.calcularTopYBottomPreguntas(estadisticasBD),
      nps_satisfaccion: this.calcularNPS(estadisticasBD, ultimaPagina),
      detalle_por_dimension: this.calcularDetallePreguntasPorDimension(estadisticasBD, nombresConstructos),
      tabla_socios_comunitarios: this.obtenerListaSociosComunitarios(estadisticasBD),
      
      fiabilidad_constructos: this.mathService.calcularFiabilidadCronbach(
        estadisticasBD, 
        ultimaPagina, 
        nombresConstructos, 
        this.mapearNombreConstructo.bind(this),
        paginaFiltro
      )
    };
  }

  private calcularDistribucionGenero(estadisticasBD: Partial<Estadistica>[]) {
    const conteo = estadisticasBD.reduce((acc, est) => {
      const gen = est.datos_respondente?.['genero'] || 'No especificado';
      acc[gen] = (acc[gen] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(conteo).map(([genero, cantidad]) => ({ genero, cantidad }));
  }

  private calcularPromediosPorPagina(preguntas: PreguntaAplanada[], nombresConstructos: string[]) {
    const sumasPorPagina: Record<number, { suma: number; cantidad: number }> = {};
    preguntas.forEach(p => {
      if (p.valor_numerico > 0) {
        if (!sumasPorPagina[p.numero_pagina]) {
          sumasPorPagina[p.numero_pagina] = { suma: 0, cantidad: 0 };
        }
        sumasPorPagina[p.numero_pagina].suma += p.valor_numerico;
        sumasPorPagina[p.numero_pagina].cantidad += 1;
      }
    });

    return Object.keys(sumasPorPagina).map(pagina => {
      const numPagina = Number(pagina);
      const datos = sumasPorPagina[numPagina];
      return {
        numero_pagina: numPagina,
        nombre_constructo: this.mapearNombreConstructo(numPagina, nombresConstructos),
        promedio_constructo: Number((datos.suma / datos.cantidad).toFixed(1))
      };
    });
  }

  private calcularSatisfaccionGeneral(todasLasPreguntas: PreguntaAplanada[]) {
    const paginasNumeros = todasLasPreguntas.map(p => p.numero_pagina);
    if (paginasNumeros.length === 0) return 0;
    
    const ultimaPagina = Math.max(...paginasNumeros);

    let preguntasSatisfaccion = todasLasPreguntas.filter(p => 
      p.numero_pagina === ultimaPagina && 
      p.pregunta.toLowerCase().includes('satisfacción general') &&
      p.valor_numerico > 0
    );
    
    if (preguntasSatisfaccion.length === 0) {
      preguntasSatisfaccion = todasLasPreguntas.filter(p => 
        p.numero_pagina === ultimaPagina && 
        p.valor_numerico >= 1 && 
        p.valor_numerico <= 7
      );
    }
    
    if (preguntasSatisfaccion.length === 0) return 0;

    const sumaTotal = preguntasSatisfaccion.reduce((sum, p) => sum + p.valor_numerico, 0);
    return Number((sumaTotal / preguntasSatisfaccion.length).toFixed(1));
  }

  private extraerPreguntasConPagina(estadisticasBD: Partial<Estadistica>[]): PreguntaAplanada[] {
    return estadisticasBD.flatMap(est => 
      (est.constructos_paginas || []).flatMap((pagina) => 
        (pagina.preguntas_pagina || []).map((preg) => ({
          numero_pagina: pagina.numero_pagina,
          pregunta: preg.pregunta,
          respuesta_texto: preg.respuesta_texto,
          valor_numerico: preg.valor_numerico
        }))
      )
    );
  }

  private mapearNombreConstructo(numeroPagina: number, nombresConstructos: string[]): string {
    const indice = numeroPagina - 2; 
    return (nombresConstructos && nombresConstructos[indice]) 
      ? nombresConstructos[indice] 
      : `Constructo Página ${numeroPagina}`;
  }

  private generarMetricasVacias(totalEsperados: number) {
    return {
      total_esperados: totalEsperados,
      total_encuestados: 0,
      tasa_respuesta_porcentaje: 0,
      distribucion_genero: [],
      promedios_por_pagina: [],
      promedio_satisfaccion_general: 0,
      fiabilidad_constructos: []
    };
  }

  private calcularSatisfaccionPorAtributo(estadisticasBD: Partial<Estadistica>[], ultimaPagina: number, atributo: string) {
    const acumulador = new Map<string, { suma: number; cantidad: number }>();

    for (const est of estadisticasBD) {
      const valorAtributo = est.datos_respondente?.[atributo];
      if (!valorAtributo || valorAtributo === 'No especificado' || valorAtributo === 'No especificada') continue;
      if (!est.constructos_paginas) continue;

      let suma = 0;
      let cantidad = 0;

      for (const pagina of est.constructos_paginas) {
        if (pagina.numero_pagina === ultimaPagina && pagina.preguntas_pagina) {
          for (const preg of pagina.preguntas_pagina) {
            if (preg.valor_numerico > 0) {
              suma += preg.valor_numerico;
              cantidad++;
            }
          }
          break;
        }
      }

      if (cantidad > 0) {
        const promedioRespondente = suma / cantidad;
        if (!acumulador.has(valorAtributo)) {
          acumulador.set(valorAtributo, { suma: 0, cantidad: 0 });
        }
        const stats = acumulador.get(valorAtributo)!;
        stats.suma += promedioRespondente;
        stats.cantidad += 1;
      }
    }

    return Array.from(acumulador.entries())
      .map(([nombre, datos]) => ({
        nombre,
        promedio: Number((datos.suma / datos.cantidad).toFixed(1))
      }))
      .sort((a, b) => b.promedio - a.promedio);
  }

  private calcularTopYBottomPreguntas(estadisticasBD: Partial<Estadistica>[]) {
    const acumulador = new Map<string, { suma: number; cantidad: number }>();

    for (const est of estadisticasBD) {
      if (!est.constructos_paginas) continue;

      for (const pagina of est.constructos_paginas) {
        if (!pagina.preguntas_pagina) continue;

        for (const preg of pagina.preguntas_pagina) {
          if (preg.valor_numerico > 0) {
            if (!acumulador.has(preg.pregunta)) {
              acumulador.set(preg.pregunta, { suma: 0, cantidad: 0 });
            }
            const stats = acumulador.get(preg.pregunta)!;
            stats.suma += preg.valor_numerico;
            stats.cantidad += 1;
          }
        }
      }
    }

    const promedios = Array.from(acumulador.entries())
      .map(([pregunta, datos]) => ({
        pregunta,
        promedio: Number((datos.suma / datos.cantidad).toFixed(1))
      }))
      .sort((a, b) => b.promedio - a.promedio);

    return {
      top_3: promedios.slice(0, 3),
      bottom_3: promedios.slice(-3).reverse() 
    };
  }

  private calcularNPS(estadisticasBD: Partial<Estadistica>[], ultimaPagina: number) {
    let promotores = 0;
    let pasivos = 0;
    let detractores = 0;
    let totalValidos = 0;

    for (const est of estadisticasBD) {
      if (!est.constructos_paginas) continue;

      let suma = 0;
      let cantidad = 0;

      for (const pagina of est.constructos_paginas) {
        if (pagina.numero_pagina === ultimaPagina && pagina.preguntas_pagina) {
          for (const preg of pagina.preguntas_pagina) {
            if (preg.valor_numerico > 0) {
              suma += preg.valor_numerico;
              cantidad++;
            }
          }
          break;
        }
      }

      if (cantidad > 0) {
        const promedio = suma / cantidad;
        if (promedio >= 6) promotores++;
        else if (promedio >= 5) pasivos++;
        else detractores++;
        totalValidos++;
      }
    }

    if (totalValidos === 0) return null;

    const promotores_pct = Number(((promotores / totalValidos) * 100).toFixed(1));
    const pasivos_pct = Number(((pasivos / totalValidos) * 100).toFixed(1));
    const detractores_pct = Number(((detractores / totalValidos) * 100).toFixed(1));

    return {
      score_nps: Number((promotores_pct - detractores_pct).toFixed(1)),
      distribucion_porcentajes: { promotores_pct, pasivos_pct, detractores_pct },
      cantidades_reales: { promotores, pasivos, detractores, total: totalValidos }
    };
  }

  private calcularDetallePreguntasPorDimension(estadisticasBD: Partial<Estadistica>[], nombresConstructos: string[]) {
    const paginasMap = new Map<number, Map<string, { suma: number; cantidad: number; frecuencias: Record<number, number> }>>();


    for (const est of estadisticasBD) {
      if (!est.constructos_paginas) continue;

      for (const pagina of est.constructos_paginas) {
        if (!paginasMap.has(pagina.numero_pagina)) {
          paginasMap.set(pagina.numero_pagina, new Map());
        }
        const mapaPreguntas = paginasMap.get(pagina.numero_pagina)!;

        if (!pagina.preguntas_pagina) continue;

        for (const preg of pagina.preguntas_pagina) {
          const valor = preg.valor_numerico;
          
          if (valor > 0) {
            if (!mapaPreguntas.has(preg.pregunta)) {
              mapaPreguntas.set(preg.pregunta, { suma: 0, cantidad: 0, frecuencias: {} });
            }
            const stats = mapaPreguntas.get(preg.pregunta)!;
            
            stats.suma += valor;
            stats.cantidad += 1;
            stats.frecuencias[valor] = (stats.frecuencias[valor] || 0) + 1;
          }
        }
      }
    }

    const resultado = Array.from(paginasMap.entries()).map(([numeroPagina, mapaPreguntas]) => {
      const indiceNombre = numeroPagina - 2;
      const nombreConstructo = nombresConstructos[indiceNombre] || `Dimensión ${numeroPagina}`;

      const preguntas = Array.from(mapaPreguntas.entries()).map(([pregunta, stats]) => ({
        pregunta,
        promedio: Number((stats.suma / stats.cantidad).toFixed(1)),
        total_respuestas: stats.cantidad,
        distribucion_frecuencias: stats.frecuencias 
      }));

      return {
        numero_pagina: numeroPagina,
        nombre_constructo: nombreConstructo,
        preguntas
      };
    });

    return resultado.sort((a, b) => a.numero_pagina - b.numero_pagina);
  }

  private obtenerListaSociosComunitarios(estadisticasBD: Partial<Estadistica>[]) {
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