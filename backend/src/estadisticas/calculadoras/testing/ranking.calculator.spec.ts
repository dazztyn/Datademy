import { RankingCalculator } from '../ranking.calculator';
import { Estadistica, RespuestaPregunta } from '../../schemas/estadisticas.schema';

describe('RankingCalculator', () => {
  let calculator: RankingCalculator;

  beforeEach(() => {
    calculator = new RankingCalculator();
  });

  describe('calcular', () => {
    it('debería calcular el ranking top 3 y bottom 3 correctamente ignorando notas cero', () => {
      const mockEstadisticas: Partial<Estadistica>[] = [
        {
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguntas_pagina: [
                { pregunta: 'Q1', respuesta_texto: '7', valor_numerico: 7 },
                { pregunta: 'Q2', respuesta_texto: '6', valor_numerico: 6 },
                { pregunta: 'Q3', respuesta_texto: '5', valor_numerico: 5 },
                { pregunta: 'Q4', respuesta_texto: '4', valor_numerico: 4 },
                { pregunta: 'QTexto', respuesta_texto: 'Hola', valor_numerico: 0 }
              ]
            }
          ]
        }
      ];

      const resultado = calculator.calcular(mockEstadisticas);
      
      expect(resultado.top_3.length).toBe(3);
      expect(resultado.top_3[0].pregunta).toBe('Q1');
      expect(resultado.top_3[0].promedio).toBe(7);
      
      expect(resultado.bottom_3.length).toBe(3);
      expect(resultado.bottom_3[0].pregunta).toBe('Q4');
      expect(resultado.bottom_3[0].promedio).toBe(4);
    });

    it('debería ignorar usuarios sin constructos o sin preguntas para evitar crashes', () => {
      const mockIncompleto: Partial<Estadistica>[] = [
        { constructos_paginas: undefined },
        { constructos_paginas: [{ numero_pagina: 2, preguntas_pagina: undefined as unknown as RespuestaPregunta[] }] }
      ];

      const resultado = calculator.calcular(mockIncompleto);
      
      expect(resultado.top_3.length).toBe(0);
      expect(resultado.bottom_3.length).toBe(0);
    });
  });
});