import { Injectable } from '@nestjs/common';
import { Estadistica } from '../schemas/estadisticas.schema';

@Injectable()
export class RankingCalculator {
  calcular(estadisticasBD: Partial<Estadistica>[]) {
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
}