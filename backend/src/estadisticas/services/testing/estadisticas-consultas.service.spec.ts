import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasConsultasService } from '../estadisticas-consultas.service';
import { EstadisticasAnaliticasService } from '../estadisticas-analiticas.service';
import { EstadisticasFormatterService } from '../estadisticas-formatter.service';
import { EstadisticasRepository } from '../../estadisticas.repository';
import { ProcesosService } from '../../../formularios/services/procesos.service';
import { TipoFormulario } from '../../../common/enum/tipo-formulario.enum';

describe('EstadisticasConsultasService', () => {
  let service: EstadisticasConsultasService;
  let mockAnaliticas: { calcularMetricasAnaliticas: jest.Mock };
  let mockFormatter: { formatearParaFrontend: jest.Mock };
  let mockRepositorio: { buscarPorQuery: jest.Mock, calcularPromediosAgrupadosPorPagina: jest.Mock, calcularDistribucionGeneroMongo: jest.Mock, calcularNpsMongo: jest.Mock, obtenerOpcionesDistintas: jest.Mock };
  let mockProcesos: { obtenerProcesoInterno: jest.Mock };

  beforeEach(async () => {
    mockAnaliticas = { calcularMetricasAnaliticas: jest.fn() };
    mockFormatter = { formatearParaFrontend: jest.fn() };
    mockRepositorio = { 
      buscarPorQuery: jest.fn(),
      calcularPromediosAgrupadosPorPagina: jest.fn(),
      calcularDistribucionGeneroMongo: jest.fn(),
      calcularNpsMongo: jest.fn(),
      obtenerOpcionesDistintas: jest.fn()
    };
    mockProcesos = { obtenerProcesoInterno: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasConsultasService,
        { provide: EstadisticasAnaliticasService, useValue: mockAnaliticas },
        { provide: EstadisticasFormatterService, useValue: mockFormatter },
        { provide: EstadisticasRepository, useValue: mockRepositorio },
        { provide: ProcesosService, useValue: mockProcesos },
      ],
    }).compile();

    service = module.get<EstadisticasConsultasService>(EstadisticasConsultasService);
  });

  describe('obtenerResultadosTabulares', () => {
    it('debería consultar y formatear resultados ignorando filtros vacíos o nulos', async () => {
      mockRepositorio.buscarPorQuery.mockResolvedValue(['item1']);
      mockFormatter.formatearParaFrontend.mockReturnValue(['formateado']);

      const filtros = { carrera: 'Ingeniería', vacio: '', invalido: null as unknown as string };
      
      const resultado = await service.obtenerResultadosTabulares('p1', 'u1', filtros);
      
      expect(mockRepositorio.buscarPorQuery).toHaveBeenCalledWith(
        { proceso_id: 'p1', usuario_id: 'u1', 'datos_respondente.carrera': 'Ingeniería' },
        '',
        { fecha_respuesta: -1 },
        1000
      );
      expect(resultado.total_respuestas).toBe(1);
      expect(resultado.datos).toEqual(['formateado']);
    });
  });

  describe('obtenerMetricasAnaliticas', () => {
    it('debería calcular métricas integrando todos los repositorios', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({
        formulario_estudiantes: { nombres_constructos: ['C1'], total_esperados: 10, escala_satisfaccion: 7, escala_likert: 5 }
      });
      mockRepositorio.calcularPromediosAgrupadosPorPagina.mockResolvedValue([]);
      mockRepositorio.calcularDistribucionGeneroMongo.mockResolvedValue([]);
      mockRepositorio.calcularNpsMongo.mockResolvedValue([]);
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);
      mockAnaliticas.calcularMetricasAnaliticas.mockReturnValue({ metricas: true } as unknown as Record<string, unknown>);

      const resultado = await service.obtenerMetricasAnaliticas('p1', 'u1', { tipo: TipoFormulario.ESTUDIANTES, asignatura: 'Mate' }, 3);

      expect(mockRepositorio.buscarPorQuery).toHaveBeenCalledWith(
        { proceso_id: 'p1', usuario_id: 'u1', 'datos_respondente.asignatura': 'Mate', tipo_formulario: 'estudiantes' },
        'constructos_paginas datos_respondente -_id'
      );
      expect(resultado.status).toBe('exito');
    });

    it('debería ejecutar la rama SOCIOS para obtenerMetricasAnaliticas (Línea 55)', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({
        formulario_socios: { nombres_constructos: ['C2'], total_esperados: 20, escala_satisfaccion: 5, escala_likert: 7 }
      });
      mockRepositorio.calcularPromediosAgrupadosPorPagina.mockResolvedValue([]);
      mockRepositorio.calcularDistribucionGeneroMongo.mockResolvedValue([]);
      mockRepositorio.calcularNpsMongo.mockResolvedValue([]);
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);

      await service.obtenerMetricasAnaliticas('p1', 'u1', { tipo: TipoFormulario.SOCIOS });

      expect(mockAnaliticas.calcularMetricasAnaliticas).toHaveBeenCalledWith(
        [], ['C2'], 20, undefined, [], [], [], 5, 7 
      );
    });

    it('debería usar el tipo ESTUDIANTES por defecto si el filtro no lo provee', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({ formulario_estudiantes: null });
      mockRepositorio.calcularPromediosAgrupadosPorPagina.mockResolvedValue([]);
      mockRepositorio.calcularDistribucionGeneroMongo.mockResolvedValue([]);
      mockRepositorio.calcularNpsMongo.mockResolvedValue([]);
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);

      await service.obtenerMetricasAnaliticas('p1', 'u1', {});

      expect(mockAnaliticas.calcularMetricasAnaliticas).toHaveBeenCalled();
    });

    it('debería usar fallbacks de escala si el formulario existe pero le faltan datos', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({
        formulario_estudiantes: { } 
      });
      mockRepositorio.calcularPromediosAgrupadosPorPagina.mockResolvedValue([]);
      mockRepositorio.calcularDistribucionGeneroMongo.mockResolvedValue([]);
      mockRepositorio.calcularNpsMongo.mockResolvedValue([]);
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);

      await service.obtenerMetricasAnaliticas('p1', 'u1', { tipo: TipoFormulario.ESTUDIANTES });

      expect(mockAnaliticas.calcularMetricasAnaliticas).toHaveBeenCalledWith(
        [], [], 0, undefined, [], [], [], 7, 4 
      );
    });
  });

  describe('obtenerOpcionesFiltrosDisponibles', () => {
    it('debería retornar filtros para ESTUDIANTES', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({
        formulario_estudiantes: { nombres_constructos: ['Liderazgo'] }
      });
      mockRepositorio.obtenerOpcionesDistintas
        .mockResolvedValueOnce(['Medicina', 'No especificada']) 
        .mockResolvedValueOnce(['Sede Central']) 
        .mockResolvedValueOnce(['Femenino', 'No especificado']) 
        .mockResolvedValueOnce(['N1']) 
        .mockResolvedValueOnce(['Biología', 'No especificada']); 

      const resultado = await service.obtenerOpcionesFiltrosDisponibles('p1', 'u1', TipoFormulario.ESTUDIANTES);

      expect(resultado!.filtros_disponibles.carreras).toEqual(['Medicina']);
    });

    it('debería retornar filtros para SOCIOS', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({}); 
      mockRepositorio.obtenerOpcionesDistintas
        .mockResolvedValueOnce(['Empresa X', 'No especificada']) 
        .mockResolvedValueOnce(['Femenino', 'No especificado']); 

      const resultado = await service.obtenerOpcionesFiltrosDisponibles('p1', 'u1', TipoFormulario.SOCIOS);

      expect(resultado!.filtros_disponibles.organizaciones).toEqual(['Empresa X']);
    });

    it('debería usar estudiantes por defecto en el parámetro tipoFormulario', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({ formulario_estudiantes: {} });
      mockRepositorio.obtenerOpcionesDistintas.mockResolvedValue([]);

      await service.obtenerOpcionesFiltrosDisponibles('p1', 'u1');
      
      expect(mockProcesos.obtenerProcesoInterno).toHaveBeenCalledWith('u1', 'p1');
    });
  });
});