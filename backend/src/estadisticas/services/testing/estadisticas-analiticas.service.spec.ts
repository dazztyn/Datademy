import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasAnaliticasService } from '../estadisticas-analiticas.service';
import { EstadisticasMathService } from '../estadisticas-math.service';
import { NpsCalculator } from '../../calculadoras/nps.calculator';
import { RankingCalculator } from '../../calculadoras/ranking.calculator';
import { DemograficosCalculator } from '../../calculadoras/demograficos.calculator';
import { SatisfaccionCalculator } from '../../calculadoras/satisfaccion.calculator';
import { Estadistica } from '../../schemas/estadisticas.schema';

describe('EstadisticasAnaliticasService', () => {
  let service: EstadisticasAnaliticasService;

  let mockMath: { calcularFiabilidadCronbach: jest.Mock };
  let mockNps: { calcular: jest.Mock; formatearNpsOptimizado: jest.Mock };
  let mockRanking: { calcular: jest.Mock };
  let mockDemo: { calcularDistribucionGenero: jest.Mock; obtenerListaSociosComunitarios: jest.Mock; formatearDistribucionOptimizada: jest.Mock };
  let mockSatis: { calcularPromediosPorPagina: jest.Mock; calcularSatisfaccionGeneral: jest.Mock; calcularSatisfaccionPorAtributo: jest.Mock; calcularDetallePreguntasPorDimension: jest.Mock; formatearPromediosOptimizados: jest.Mock };

  beforeEach(async () => {
    mockMath = { calcularFiabilidadCronbach: jest.fn() };
    mockNps = { calcular: jest.fn(), formatearNpsOptimizado: jest.fn() };
    mockRanking = { calcular: jest.fn() };
    mockDemo = { calcularDistribucionGenero: jest.fn(), obtenerListaSociosComunitarios: jest.fn(), formatearDistribucionOptimizada: jest.fn() };
    mockSatis = { calcularPromediosPorPagina: jest.fn(), calcularSatisfaccionGeneral: jest.fn(), calcularSatisfaccionPorAtributo: jest.fn(), calcularDetallePreguntasPorDimension: jest.fn(), formatearPromediosOptimizados: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasAnaliticasService,
        { provide: EstadisticasMathService, useValue: mockMath },
        { provide: NpsCalculator, useValue: mockNps },
        { provide: RankingCalculator, useValue: mockRanking },
        { provide: DemograficosCalculator, useValue: mockDemo },
        { provide: SatisfaccionCalculator, useValue: mockSatis },
      ],
    }).compile();

    service = module.get<EstadisticasAnaliticasService>(EstadisticasAnaliticasService);

    mockSatis.calcularPromediosPorPagina.mockReturnValue([]);
    mockSatis.calcularSatisfaccionGeneral.mockReturnValue(0);
    mockSatis.formatearPromediosOptimizados.mockReturnValue([]);
    mockDemo.formatearDistribucionOptimizada.mockReturnValue([]);
    mockNps.formatearNpsOptimizado.mockReturnValue({ score_nps: 0 });
    mockMath.calcularFiabilidadCronbach.mockReturnValue([])
  });

  describe('calcularMetricasAnaliticas', () => {
    it('debería retornar métricas vacías si no hay datos en estadisticasBD', () => {
      const result = service.calcularMetricasAnaliticas([], ['C1'], 10);
      expect(result.total_encuestados).toBe(0);
      expect(result.total_esperados).toBe(10);
      expect(result.tasa_respuesta_porcentaje).toBe(0);
      expect(result.escala_maxima_satisfaccion).toBe(7);
      expect(result.porcentaje_volveria_participar).toBeNull();
    });

    it('debería manejar encuestas sin preguntas válidas para cubrir ultimaPagina = 0', () => {
      const result = service.calcularMetricasAnaliticas([{ constructos_paginas: [] }] as unknown as Partial<Estadistica>[], [], 10);
      expect(result.promedio_satisfaccion_general).toBe(0);
      expect(result.total_encuestados).toBe(1);
    });

    it('debería calcular métricas correctamente con fallbacks (sin Mongo) y evaluar "volvería a participar"', () => {
      const estadisticas = [
        {
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguntas_pagina: [
                { pregunta: 'Volvería a participar', respuesta_texto: 'Sí', valor_numerico: 0 },
                { pregunta: 'Otra', respuesta_texto: 'algo', valor_numerico: 5 }
              ]
            },
            {
              numero_pagina: 3,
              preguntas_pagina: [
                { pregunta: 'Volveria a participar', respuesta_texto: 'si', valor_numerico: 0 },
                { pregunta: 'Otra 2', respuesta_texto: 'algo', valor_numerico: 4 }
              ]
            }
          ]
        },
        {
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguntas_pagina: [
                { pregunta: 'volveria a participar', respuesta_texto: undefined, valor_numerico: 1 } 
              ]
            }
          ]
        },
        {
          constructos_paginas: undefined 
        },
        {
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguntas_pagina: undefined
            },
            {
              numero_pagina: 4,
              preguntas_pagina: [
                { pregunta: 'volveria a participar', respuesta_texto: 'no', valor_numerico: 0 } 
              ]
            }
          ]
        }
      ] as unknown as Partial<Estadistica>[];

      mockSatis.calcularPromediosPorPagina.mockReturnValue([
        { numero_pagina: 2, promedio_constructo: 5 },
        { numero_pagina: 3, promedio_constructo: 6 }
      ]);
      mockSatis.calcularSatisfaccionGeneral.mockReturnValue(5.5);
      
      const result = service.calcularMetricasAnaliticas(estadisticas, ['ConstructoA'], 0);

      expect(result.tasa_respuesta_porcentaje).toBe(0); 
      expect(result.porcentaje_volveria_participar).toBe(75);
      expect(result.promedio_satisfaccion_general).toBe(5.5);

      
    });

    it('debería usar optimizaciones de Mongo y paginaFiltro', () => {
      const estadisticas = [
        {
          constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', respuesta_texto: 'R', valor_numerico: 5 }] },
            { numero_pagina: 3, preguntas_pagina: [{ pregunta: 'P2', respuesta_texto: 'R2', valor_numerico: 4 }] }
          ]
        }
      ] as unknown as Partial<Estadistica>[];

      mockSatis.formatearPromediosOptimizados.mockReturnValue([{ numero_pagina: 2, promedio_constructo: 6 }]);
      mockDemo.formatearDistribucionOptimizada.mockReturnValue([{ genero: 'Masculino', cantidad: 1 }]);
      mockNps.formatearNpsOptimizado.mockReturnValue({ score_nps: 100 });

      const result = service.calcularMetricasAnaliticas(
        estadisticas, 
        ['C1'], 
        10, 
        2,
        [{ _id: 2, promedio_bruto: 6 }] as unknown as any, 
        [{ _id: 'Masculino', cantidad: 1 }] as unknown as any, 
        [{ _id: null, promotores: 1, pasivos: 0, detractores: 0, totalValidos: 1 }] as unknown as any
      );

      expect(mockSatis.formatearPromediosOptimizados).toHaveBeenCalled();
      expect(mockDemo.formatearDistribucionOptimizada).toHaveBeenCalled();
      expect(mockNps.formatearNpsOptimizado).toHaveBeenCalled();
      
      expect(result.tasa_respuesta_porcentaje).toBe(10); 
      expect(result.porcentaje_volveria_participar).toBeNull(); 
    });

    it('debería probar el mapeo de nombres de constructos internamente para cobertura total', () => {
      const estadisticas = [
        {
          constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: [{ pregunta: 'P1', respuesta_texto: 'R', valor_numerico: 5 }] }
          ]
        }
      ] as unknown as Partial<Estadistica>[];

      mockMath.calcularFiabilidadCronbach.mockImplementation((est, ult, nombres, mapeador, filtro) => {
    
        const ramaExito = mapeador(2, ['ConstructoA']); 
        const ramaFallback = mapeador(3, ['ConstructoA']); 
        const ramaVacia = mapeador(4, undefined); 

        expect(ramaExito).toBe('ConstructoA');
        expect(ramaFallback).toBe('Constructo Página 3');
        expect(ramaVacia).toBe('Constructo Página 4');

        return [];
      });

      service.calcularMetricasAnaliticas(estadisticas, ['C1'], 10);
      expect(mockMath.calcularFiabilidadCronbach).toHaveBeenCalled();
    });

    it('debería filtrar constructos por paginaFiltro correctamente (Línea 64)', () => {
      const estadisticas = [
        {
          constructos_paginas: [
            { numero_pagina: 1, preguntas_pagina: [] }, 
            { numero_pagina: 2, preguntas_pagina: [] } 
          ]
        }
      ] as unknown as Partial<Estadistica>[];

      service.calcularMetricasAnaliticas(estadisticas, [], 10, 2);
      
      expect(mockSatis.calcularPromediosPorPagina).toHaveBeenCalled();
    });

    it('debería usar valores por defecto en generarMetricasVacias (Línea 156)', () => {
      const result = (service as any).generarMetricasVacias(10);
      
      expect(result.escala_maxima_satisfaccion).toBe(7);
      expect(result.escala_maxima_likert).toBe(4);
    });

  });
});