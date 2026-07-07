import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasComparativasService } from '../estadisticas-comparativas.service';
import { EstadisticasRepository } from '../../estadisticas.repository';
import { ProcesosService } from '../../../formularios/services/procesos.service';
import { EstadisticasAnaliticasService } from '../estadisticas-analiticas.service';
import { TipoFormulario } from '../../../common/enum/tipo-formulario.enum';
import { BadRequestException } from '@nestjs/common';
import { ProcesoDocument } from '../../../formularios/schemas/proceso.schema';
import { MetricaConstructo } from '../../interfaces/metrica-constructo.interface';
import { ProcesoComparativa } from '../../interfaces/proceso-comparativo.interface';

describe('EstadisticasComparativasService', () => {
  let service: EstadisticasComparativasService;
  
  let mockRepositorio: jest.Mocked<EstadisticasRepository>;
  let mockProcesosService: jest.Mocked<ProcesosService>;
  let mockAnaliticasService: jest.Mocked<EstadisticasAnaliticasService>;

  beforeEach(async () => {
    mockRepositorio = {
      buscarPorQuery: jest.fn(),
      obtenerOpcionesDistintas: jest.fn(),
    } as unknown as jest.Mocked<EstadisticasRepository>;

    mockProcesosService = {
      obtenerProcesoInterno: jest.fn(),
    } as unknown as jest.Mocked<ProcesosService>;

    mockAnaliticasService = {
      calcularMetricasAnaliticas: jest.fn(),
    } as unknown as jest.Mocked<EstadisticasAnaliticasService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasComparativasService,
        { provide: EstadisticasRepository, useValue: mockRepositorio },
        { provide: ProcesosService, useValue: mockProcesosService },
        { provide: EstadisticasAnaliticasService, useValue: mockAnaliticasService },
      ],
    }).compile();

    service = module.get<EstadisticasComparativasService>(EstadisticasComparativasService);
  });

  describe('obtenerComparativaGlobal', () => {
    it('debería calcular la comparativa global, ordenar por año y calcular variaciones', async () => {
      mockProcesosService.obtenerProcesoInterno
        .mockResolvedValueOnce({ _id: 'id1', nombre_proceso: 'Proceso Antiguo', anio: 2023 } as unknown as ProcesoDocument)
        .mockResolvedValueOnce({ _id: 'id2', nombre_proceso: 'Proceso Nuevo', anio: 2024, formulario_estudiantes: { nombres_constructos: ['C1'] } } as unknown as ProcesoDocument);
      
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);
      
      mockAnaliticasService.calcularMetricasAnaliticas
        .mockReturnValueOnce({
          promedio_satisfaccion_general: 5.0,
          promedios_por_pagina: [{ nombre_constructo: 'C1', promedio_constructo: 4.5, numero_pagina: 2 } as MetricaConstructo],
          fiabilidad_constructos: [{ nombre_constructo: 'C1', alfa_cronbach_global: 0.8, alfa_si_se_elimina_pregunta: { 'P1': 0.7 }, numero_pagina: 2 }],
          detalle_por_dimension: [{ nombre_constructo: 'C1', preguntas: [{ pregunta: 'P1', promedio: 4.0, total_respuestas: 10, distribucion_frecuencias: {} }], numero_pagina: 2, pregunta_mayor_promedio: null, pregunta_menor_promedio: null }]
        } as unknown as ProcesoComparativa['metricas'])
        .mockReturnValueOnce({
          promedio_satisfaccion_general: 6.5,
          promedios_por_pagina: [{ nombre_constructo: 'C1', promedio_constructo: 6.0, numero_pagina: 2 } as MetricaConstructo],
          fiabilidad_constructos: [{ nombre_constructo: 'C1', alfa_cronbach_global: 0.9, alfa_si_se_elimina_pregunta: { 'P1': 0.8 }, numero_pagina: 2 }],
          detalle_por_dimension: [{ nombre_constructo: 'C1', preguntas: [{ pregunta: 'P1', promedio: 5.5, total_respuestas: 10, distribucion_frecuencias: {} }], numero_pagina: 2, pregunta_mayor_promedio: null, pregunta_menor_promedio: null }]
        } as unknown as ProcesoComparativa['metricas']);

      const resultado = await service.obtenerComparativaGlobal('usr1', ['id1', 'id2'], TipoFormulario.ESTUDIANTES);

      expect(resultado.estado).toBe('exito');
      expect(resultado.comparativa_global).toHaveLength(2);
      expect(resultado.comparativa_global[1].variacion_satisfaccion_respecto_anterior).toBe(1.5); 
      expect(resultado.comparativa_global[1].variaciones_constructos![0].variacion_respecto_anterior).toBe(1.5);
      expect(resultado.comparativa_alfas[0].promedio_alfa_constructo).toBe(0.85); 
      expect(resultado.comparativa_promedios[0].promedio_general_constructo).toBe(5.2); 
    });
  });

  describe('obtenerComparativaInterna', () => {
    it('debería lanzar BadRequestException si el campo de agrupación no existe', async () => {
      await expect(service.obtenerComparativaInterna('usr', 'proc1', 'campo_invalido'))
        .rejects.toThrow(BadRequestException);
    });

    it('debería devolver una comparativa vacía si no hay grupos válidos', async () => {
      mockProcesosService.obtenerProcesoInterno.mockResolvedValue({} as ProcesoDocument);
      mockRepositorio.obtenerOpcionesDistintas.mockResolvedValue(['No especificada', 'No especificado', null]);

      const resultado = await service.obtenerComparativaInterna('usr', 'proc1', 'carrera');
      
      expect(resultado.cantidad_procesos_comparados).toBe(0);
      expect(resultado.comparativa_global).toEqual([]);
    });

    it('debería filtrar por valoresFiltro y filtrosAdicionales construyendo la query correcta', async () => {
      mockProcesosService.obtenerProcesoInterno.mockResolvedValue({
        anio: 2026,
        formulario_estudiantes: { nombres_constructos: ['C2'] }
      } as unknown as ProcesoDocument);

      mockRepositorio.obtenerOpcionesDistintas.mockResolvedValue(['Medicina', 'Enfermería', 'Odontología']);
      
      mockAnaliticasService.calcularMetricasAnaliticas.mockReturnValue({
        promedio_satisfaccion_general: 6.0,
        promedios_por_pagina: [{ nombre_constructo: 'C2', promedio_constructo: 5.5, numero_pagina: 2 } as MetricaConstructo],
        fiabilidad_constructos: [],
        detalle_por_dimension: []
      } as unknown as ProcesoComparativa['metricas']);

      mockRepositorio.buscarPorQuery.mockResolvedValue([]);

      const resultado = await service.obtenerComparativaInterna(
        'usr', 'proc1', 'carrera', TipoFormulario.ESTUDIANTES, ['Enfermería'], { sede: 'Coquimbo', genero: '' }
      );

      expect(resultado.cantidad_procesos_comparados).toBe(1);
      expect(resultado.comparativa_global[0].nombre_proceso).toBe('Enfermería');
      
      expect(mockRepositorio.buscarPorQuery).toHaveBeenCalledWith(
        expect.objectContaining({ 
          'datos_respondente.carrera': 'Enfermería',
          'datos_respondente.sede': 'Coquimbo' 
        }),
        expect.any(String)
      );
    });
  });

  describe('cobertura de ramas defensivas y fallbacks', () => {
    it('debería manejar promedios 0, constructos faltantes y ordenamiento alfabético en empates de año', async () => {
      mockProcesosService.obtenerProcesoInterno
        .mockResolvedValueOnce({ _id: 'id1', nombre_proceso: 'B_Proceso', anio: 2026 } as unknown as ProcesoDocument)
        .mockResolvedValueOnce({ _id: 'id2', nombre_proceso: 'A_Proceso', anio: 2026 } as unknown as ProcesoDocument);
      
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);

      mockAnaliticasService.calcularMetricasAnaliticas
        .mockReturnValueOnce({
          promedio_satisfaccion_general: 0, 
          promedios_por_pagina: [], 
          detalle_por_dimension: undefined
        } as unknown as ProcesoComparativa['metricas'])
        .mockReturnValueOnce({
          promedio_satisfaccion_general: 5.0,
          promedios_por_pagina: [{ nombre_constructo: 'C_Nuevo', promedio_constructo: 5.0, numero_pagina: 2 } as MetricaConstructo],
          fiabilidad_constructos: [],
          detalle_por_dimension: []
        } as unknown as ProcesoComparativa['metricas']);

      const resultado = await service.obtenerComparativaGlobal('usr1', ['id1', 'id2'], TipoFormulario.SOCIOS);

      expect(resultado.comparativa_global[0].nombre_proceso).toBe('A_Proceso'); 
      expect(resultado.comparativa_global[1].nombre_proceso).toBe('B_Proceso');
      
      expect(resultado.comparativa_global[1].variacion_satisfaccion_respecto_anterior).toBeNull(); 
      expect(resultado.comparativa_global[1].variaciones_constructos![0].variacion_respecto_anterior).toBeNull(); 
    });
  });
});