import { Injectable } from '@nestjs/common';
import { Estadistica } from '../schemas/estadisticas.schema';
import { EstadisticasMathService } from './estadisticas-math.service';
import { PreguntaAplanada } from '../interfaces/pregunta-aplanada.interface';
import { NpsCalculator } from '../calculadoras/nps.calculator';
import { RankingCalculator } from '../calculadoras/ranking.calculator';
import { DemograficosCalculator } from '../calculadoras/demograficos.calculator';
import { SatisfaccionCalculator } from '../calculadoras/satisfaccion.calculator';
import { PromedioMongoRaw, PromedioPagina } from '../interfaces/promedios.interface';

@Injectable()
export class EstadisticasAnaliticasService 
{
  constructor(
    private readonly mathService: EstadisticasMathService,
    private readonly npsCalculator: NpsCalculator,
    private readonly rankingCalculator: RankingCalculator,
    private readonly demograficosCalculator: DemograficosCalculator,
    private readonly satisfaccionCalculator: SatisfaccionCalculator
  ) {}

  calcularMetricasAnaliticas(
    estadisticasBD: Partial<Estadistica>[], 
    nombresConstructos: string[], 
    totalEsperados: number, 
    paginaFiltro?: number, 
    promediosMongoOptimizados?: PromedioMongoRaw[]
  ) 
  {
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

    let promediosPorPagina: PromedioPagina[];

    if (promediosMongoOptimizados && promediosMongoOptimizados.length > 0) {
      promediosPorPagina = this.satisfaccionCalculator.formatearPromediosOptimizados(
        promediosMongoOptimizados, 
        nombresConstructos, 
        ultimaPagina, 
        paginaFiltro
      );
    } 
    else 
    {
      let constructosAProcesar = todasLasPreguntas.filter(p => p.numero_pagina < ultimaPagina);
      if (paginaFiltro) constructosAProcesar = constructosAProcesar.filter(p => p.numero_pagina === paginaFiltro);
      
      promediosPorPagina = this.satisfaccionCalculator.calcularPromediosPorPagina(constructosAProcesar, nombresConstructos);
    }

    const promedioSatisfaccionConstructos = promediosPorPagina.length > 0 
      ? Number((promediosPorPagina.reduce((acc, p) => acc + p.promedio_constructo, 0) / promediosPorPagina.length).toFixed(1)) 
      : 0;
    
    return {
      total_esperados: totalEsperados,
      total_encuestados: estadisticasBD.length,
      tasa_respuesta_porcentaje: tasaRespuesta,
      distribucion_genero: this.demograficosCalculator.calcularDistribucionGenero(estadisticasBD),
      promedios_por_pagina: this.calcularPromediosPorPagina(constructosAProcesar, nombresConstructos),
      promedio_satisfaccion_constructos: promedioSatisfaccionConstructos,
      promedio_satisfaccion_general: this.satisfaccionCalculator.calcularSatisfaccionGeneral(todasLasPreguntas),
      satisfaccion_por_carrera: this.satisfaccionCalculator.calcularSatisfaccionPorAtributo(estadisticasBD, ultimaPagina, 'carrera'),
      satisfaccion_por_sede: this.satisfaccionCalculator.calcularSatisfaccionPorAtributo(estadisticasBD, ultimaPagina, 'sede'),
      satisfaccion_por_organizacion: this.satisfaccionCalculator.calcularSatisfaccionPorAtributo(estadisticasBD, ultimaPagina, 'organizacion'),
      ranking_preguntas: this.rankingCalculator.calcular(estadisticasBD),
      nps_satisfaccion: this.npsCalculator.calcular(estadisticasBD, ultimaPagina),
      tabla_socios_comunitarios: this.demograficosCalculator.obtenerListaSociosComunitarios(estadisticasBD),
      detalle_por_dimension: this.satisfaccionCalculator.calcularDetallePreguntasPorDimension(estadisticasBD, nombresConstructos),
      fiabilidad_constructos: this.mathService.calcularFiabilidadCronbach(
        estadisticasBD, 
        ultimaPagina, 
        nombresConstructos, 
        this.mapearNombreConstructo.bind(this),
        paginaFiltro
      )
    };
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