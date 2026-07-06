import { NpsCalculator } from '../nps.calculator';
import { Estadistica, RespuestaPregunta } from '../../schemas/estadisticas.schema';

describe('NpsCalculator', () => {
  let calculator: NpsCalculator;

  beforeEach(() => {
    calculator = new NpsCalculator();
  });

  it('debería calcular correctamente promotores, pasivos y detractores', () => {
    const ultimaPagina = 4;
    
    const mockEstadisticas: Partial<Estadistica>[] = [
      { constructos_paginas: [{ numero_pagina: 4, preguntas_pagina: [{ pregunta: 'NPS', respuesta_texto: '7', valor_numerico: 7 }] }] }, 
      { constructos_paginas: [{ numero_pagina: 4, preguntas_pagina: [{ pregunta: 'NPS', respuesta_texto: '6',  valor_numerico: 6 }] }] }, 
      { constructos_paginas: [{ numero_pagina: 4, preguntas_pagina: [{ pregunta: 'NPS', respuesta_texto: '5',  valor_numerico: 5 }] }] }, 
      { constructos_paginas: [{ numero_pagina: 4, preguntas_pagina: [{ pregunta: 'NPS', respuesta_texto: '4',  valor_numerico: 4 }] }] }, 
    ];

    const resultado = calculator.calcular(mockEstadisticas, ultimaPagina);

    expect(resultado).toBeDefined();
    expect(resultado!.score_nps).toBe(25);
    expect(resultado!.distribucion_porcentajes.promotores_pct).toBe(50);
    expect(resultado!.cantidades_reales.total).toBe(4);
  });

  it('debería retornar null si no hay respuestas válidas', () => {
    const resultado = calculator.calcular([], 4);
    expect(resultado).toBeNull();
  });

  it('debería ignorar usuarios sin constructos y preguntas de texto (valor_numerico = 0)', () => {
    const mockIncompleto: Partial<Estadistica>[] = [
      { constructos_paginas: undefined }, 
      { constructos_paginas: [{ numero_pagina: 4, preguntas_pagina: undefined as unknown as RespuestaPregunta[] }] },
      { constructos_paginas: [{ numero_pagina: 4, preguntas_pagina: [{ pregunta: 'Comentario', respuesta_texto: 'Buen curso', valor_numerico: 0 }] }] }
    ];

    const resultado = calculator.calcular(mockIncompleto, 4);

    expect(resultado).toBeNull();
  });

  describe('formatearNpsOptimizado', () => {
    it('debería formatear correctamente los datos optimizados de Mongo', () => {
      const mockResultadosMongo = [{
        _id: null,
        promotores: 2,
        pasivos: 1,
        detractores: 1,
        totalValidos: 4
      }];

      const resultado = calculator.formatearNpsOptimizado(mockResultadosMongo);

      expect(resultado).toBeDefined();
      expect(resultado!.score_nps).toBe(25);
      expect(resultado!.distribucion_porcentajes.promotores_pct).toBe(50);
      expect(resultado!.distribucion_porcentajes.pasivos_pct).toBe(25);
      expect(resultado!.distribucion_porcentajes.detractores_pct).toBe(25);
    });

    it('debería retornar null si el arreglo está vacío o no hay válidos', () => {
      expect(calculator.formatearNpsOptimizado([])).toBeNull();
      
      const mockSinValidos = [{ _id: null, promotores: 0, pasivos: 0, detractores: 0, totalValidos: 0 }];
      expect(calculator.formatearNpsOptimizado(mockSinValidos)).toBeNull();
      expect(calculator.formatearNpsOptimizado(null!)).toBeNull();
    });
  });
});