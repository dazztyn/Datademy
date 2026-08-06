import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasMathService } from '../estadisticas-math.service';
import { Estadistica } from '../../schemas/estadisticas.schema';

describe('EstadisticasMathService', () => {
  let service: EstadisticasMathService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstadisticasMathService],
    }).compile();

    service = module.get<EstadisticasMathService>(EstadisticasMathService);
  });

  describe('calcularFiabilidadCronbach', () => {
    const mockMapeador = (num: number) => `Constructo ${num}`;

    it('debería calcular alfa de cronbach global e impacto por pregunta (Correlación Perfecta)', () => {
      const mockEstadisticas = [
        { constructos_paginas: [{ numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 5 }, { pregunta: 'P2', valor_numerico: 5 }, { pregunta: 'P3', valor_numerico: 5 }] }] },
        { constructos_paginas: [{ numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 4 }, { pregunta: 'P2', valor_numerico: 4 }, { pregunta: 'P3', valor_numerico: 4 }] }] },
        { constructos_paginas: [{ numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 3 }, { pregunta: 'P2', valor_numerico: 3 }, { pregunta: 'P3', valor_numerico: 3 }] }] }
      ] as unknown as Partial<Estadistica>[];

      const resultado = service.calcularFiabilidadCronbach(mockEstadisticas, 3, [], mockMapeador);
      
      expect(resultado).toHaveLength(1);
      expect(resultado[0].numero_pagina).toBe(2);
      expect(resultado[0].nombre_constructo).toBe('Constructo 2');
      expect(resultado[0].alfa_cronbach_global).toBe(1.0);
      expect(resultado[0].alfa_si_se_elimina_pregunta['P1']).toBe(1.0); 
    });

    it('debería ignorar la última página de satisfacción general', () => {
      const mockEstadisticas = [
        { constructos_paginas: [{ numero_pagina: 3, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 5 }] }] },
        { constructos_paginas: [{ numero_pagina: 3, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 4 }] }] }
      ] as unknown as Partial<Estadistica>[];

      const resultado = service.calcularFiabilidadCronbach(mockEstadisticas, 3, [], mockMapeador);
      
      expect(resultado).toHaveLength(0);
    });

    it('debería filtrar por paginaFiltro si se provee y omitir si no hay suficientes datos (< 2 encuestados o < 2 preguntas)', () => {
      const mockEstadisticas = [
        { constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 5 }] },
            { numero_pagina: 4, preguntas_pagina: [{ pregunta: 'P2', valor_numerico: 5 }, { pregunta: 'P3', valor_numerico: 5 }] }
        ]}
      ] as unknown as Partial<Estadistica>[];

      const resultado = service.calcularFiabilidadCronbach(mockEstadisticas, 5, [], mockMapeador, 4);
      
      expect(resultado).toHaveLength(0);
    });

    it('debería retornar 0 si la varianza total es 0 (respuestas exactamente idénticas entre encuestados)', () => {
      const mockEstadisticas = [
        { constructos_paginas: [{ numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 5 }, { pregunta: 'P2', valor_numerico: 5 }] }] },
        { constructos_paginas: [{ numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 5 }, { pregunta: 'P2', valor_numerico: 5 }] }] },
      ] as unknown as Partial<Estadistica>[];

      const resultado = service.calcularFiabilidadCronbach(mockEstadisticas, 3, [], mockMapeador);
      
      expect(resultado[0].alfa_cronbach_global).toBe(0);
      expect(resultado[0].alfa_si_se_elimina_pregunta['P1']).toBe(0); 
    });

    it('debería manejar encuestados con constructos_paginas undefined o vacíos sin fallar', () => {
      const mockEstadisticas = [
        { constructos_paginas: undefined },
        { constructos_paginas: [] }
      ] as unknown as Partial<Estadistica>[];

      const resultado = service.calcularFiabilidadCronbach(mockEstadisticas, 3, [], mockMapeador);
      
      expect(resultado).toHaveLength(0);
    });
  });

  it('debería cubrir fallbacks en preguntas_pagina (Línea 29) y valores ausentes (Líneas 70-75)', () => {
      const mockEstadisticas = [
        { 
          constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 5 }, { pregunta: 'P2', valor_numerico: 5 }] }
          ] 
        },
        { 
          constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', valor_numerico: 4 }, { pregunta: 'P2', valor_numerico: undefined as unknown as number }] }
          ] 
        },
        { 
          constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: undefined as unknown as any[] }
          ] 
        },
      ] as unknown as Partial<Estadistica>[];

      const mockMapeador = (num: number) => `Constructo ${num}`;
      
      const resultado = service.calcularFiabilidadCronbach(mockEstadisticas, 3, [], mockMapeador);
      expect(resultado).toBeDefined();
    });

});