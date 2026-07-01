import { Injectable } from '@nestjs/common';
import { Estadistica } from '../schemas/estadisticas.schema';
import { NpsMongoRaw } from '../interfaces/metricas.interface';

@Injectable()
export class NpsCalculator {
  calcular(estadisticasBD: Partial<Estadistica>[], ultimaPagina: number) {
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

  formatearNpsOptimizado(resultadosMongo: NpsMongoRaw []) { 
    if (!resultadosMongo || resultadosMongo.length === 0) return null;
    
    const data = resultadosMongo[0]; 
    if (data.totalValidos === 0) return null;

    const promotores_pct = Number(((data.promotores / data.totalValidos) * 100).toFixed(1));
    const pasivos_pct = Number(((data.pasivos / data.totalValidos) * 100).toFixed(1));
    const detractores_pct = Number(((data.detractores / data.totalValidos) * 100).toFixed(1));

    return {
      score_nps: Number((promotores_pct - detractores_pct).toFixed(1)),
      distribucion_porcentajes: { promotores_pct, pasivos_pct, detractores_pct },
      cantidades_reales: { 
        promotores: data.promotores, pasivos: data.pasivos, detractores: data.detractores, total: data.totalValidos 
      }
    };
  }

}