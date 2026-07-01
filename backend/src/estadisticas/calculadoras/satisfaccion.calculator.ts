import { Injectable } from '@nestjs/common';
import { Estadistica } from '../schemas/estadisticas.schema';
import { PreguntaAplanada } from '../interfaces/pregunta-aplanada.interface';
import { PromedioMongoRaw, PromedioPagina } from '../interfaces/metricas.interface';

@Injectable()
export class SatisfaccionCalculator {
  
  calcularPromediosPorPagina(preguntas: PreguntaAplanada[], nombresConstructos: string[]) {
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

  calcularSatisfaccionGeneral(todasLasPreguntas: PreguntaAplanada[]) {
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
        p.numero_pagina === ultimaPagina && p.valor_numerico >= 1 && p.valor_numerico <= 7
      );
    }

    if (preguntasSatisfaccion.length === 0) return 0;

    const sumaTotal = preguntasSatisfaccion.reduce((sum, p) => sum + p.valor_numerico, 0);
    return Number((sumaTotal / preguntasSatisfaccion.length).toFixed(1));
  }

  calcularSatisfaccionPorAtributo(estadisticasBD: Partial<Estadistica>[], ultimaPagina: number, atributo: string) {
    const acumulador = new Map<string, { suma: number; cantidad: number }>();

    for (const est of estadisticasBD) {
      const valorAtributo = est.datos_respondente?.[atributo as keyof typeof est.datos_respondente] as string | undefined;
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

  calcularDetallePreguntasPorDimension(estadisticasBD: Partial<Estadistica>[], nombresConstructos: string[]) {
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

    return Array.from(paginasMap.entries()).map(([numeroPagina, mapaPreguntas]) => {
      const nombreConstructo = this.mapearNombreConstructo(numeroPagina, nombresConstructos);
      const preguntas = Array.from(mapaPreguntas.entries()).map(([pregunta, stats]) => ({
        pregunta,
        promedio: Number((stats.suma / stats.cantidad).toFixed(1)),
        total_respuestas: stats.cantidad,
        distribucion_frecuencias: stats.frecuencias 
      }));

      const ordenadas = preguntas.length > 0 
        ? [...preguntas].sort((a, b) => b.promedio - a.promedio)
        : [];

      const pregunta_mayor_promedio = ordenadas.length > 0
        ? { 
            pregunta: ordenadas[0].pregunta, 
            promedio: ordenadas[0].promedio 
          }
        : null;

      const pregunta_menor_promedio = ordenadas.length > 0
        ? { 
            pregunta: ordenadas[ordenadas.length - 1].pregunta, 
            promedio: ordenadas[ordenadas.length - 1].promedio 
          }
        : null;

      return { 
        numero_pagina: numeroPagina, 
        nombre_constructo: nombreConstructo,
        pregunta_mayor_promedio,
        pregunta_menor_promedio, 
        preguntas 
      };
    }).sort((a, b) => a.numero_pagina - b.numero_pagina);
  }

  mapearNombreConstructo(numeroPagina: number, nombresConstructos: string[]): string {
    const indice = numeroPagina - 2;
    return (nombresConstructos && nombresConstructos[indice]) 
      ? nombresConstructos[indice] 
      : `Constructo Página ${numeroPagina}`;
  }

  formatearPromediosOptimizados(
    promediosRaw: PromedioMongoRaw[], 
    nombresConstructos: string[],
    ultimaPagina: number,
    paginaFiltro?: number
  ): PromedioPagina[] {
    
    let promedios = promediosRaw.map(item => ({
      numero_pagina: item._id,
      nombre_constructo: this.mapearNombreConstructo(item._id, nombresConstructos), 
      promedio_constructo: Number(item.promedio_bruto.toFixed(1))
    }));

    promedios = promedios.filter(p => p.numero_pagina < ultimaPagina);
    
    if (paginaFiltro) {
      promedios = promedios.filter(p => p.numero_pagina === paginaFiltro);
    }

    return promedios;
  }

}