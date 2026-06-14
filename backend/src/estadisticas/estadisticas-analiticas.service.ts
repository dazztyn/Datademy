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
      if (!sumasPorPagina[p.numero_pagina]) {
        sumasPorPagina[p.numero_pagina] = { suma: 0, cantidad: 0 };
      }
      sumasPorPagina[p.numero_pagina].suma += p.valor_numerico;
      sumasPorPagina[p.numero_pagina].cantidad += 1;
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
    const preguntasSatisfaccion = todasLasPreguntas.filter(p => p.numero_pagina === ultimaPagina);
    
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
}