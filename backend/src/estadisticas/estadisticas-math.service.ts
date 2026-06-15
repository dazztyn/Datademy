import { Injectable } from '@nestjs/common';
import { PuntajesRespondente } from './interfaces/puntajes-respondente.type';
import { ResultadoCronbach } from './interfaces/resultado-cronbach.interface';
import { Estadistica } from './schemas/estadisticas.schema';

@Injectable()
export class EstadisticasMathService {
  
  public calcularFiabilidadCronbach(
    estadisticasBD: Partial<Estadistica>[], 
    ultimaPagina: number, 
    nombresConstructos: string[], 
    mapeadorNombres: (num: number, nombres: string[]) => string,
    paginaFiltro?: number
  ): ResultadoCronbach[] {
    const resultados: ResultadoCronbach[] = [];
    const paginasMap = new Map<number, PuntajesRespondente[]>(); 

    estadisticasBD.forEach(est => {
      (est.constructos_paginas || []).forEach((pagina: any) => {
        const pNum = pagina.numero_pagina;
        
        if (pNum === ultimaPagina) return; 
        if (paginaFiltro && pNum !== paginaFiltro) return;

        if (!paginasMap.has(pNum)) paginasMap.set(pNum, []);

        const respuestasRespondente: Record<string, number> = {};
        (pagina.preguntas_pagina || []).forEach((preg: any) => {
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
        nombre_constructo: mapeadorNombres(pNum, nombresConstructos),
        alfa_cronbach_global: alfaGlobal,
        alfa_si_se_elimina_pregunta: impactoPreguntas
      });
    });

    return resultados.sort((a, b) => a.numero_pagina - b.numero_pagina);
  }

  private procesarFormulaCronbach(respondentes: PuntajesRespondente[], preguntas: string[]): number {
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
    
    let suma = 0;
    let sumaCuadrados = 0;
    
    for (let i = 0; i < n; i++) {
      const valor = valores[i];
      suma += valor;
      sumaCuadrados += valor * valor;
    }
    
    const media = suma / n;
    return (sumaCuadrados - n * Math.pow(media, 2)) / (n - 1);
  }
}