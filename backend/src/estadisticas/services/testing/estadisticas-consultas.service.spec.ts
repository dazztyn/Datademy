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
    it('debería retornar filtros dinámicos usando MAPA_FILTROS_MONGO y omitir los vacíos', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({
        formulario_estudiantes: { nombres_constructos: ['Liderazgo'] }
      });
      mockRepositorio.obtenerOpcionesDistintas.mockImplementation(async (campoMongo: string) => {
        const campo = String(campoMongo).toLowerCase();
        if (campo.includes('carrera')) return ['Medicina', 'No especificada'];
        if (campo.includes('genero')) return ['Femenino', 'No especificado'];
        if (campo.includes('sede')) return ['Sede Central'];
        if (campo.includes('organizacion')) return ['Empresa X'];
        if (campo.includes('asignatura')) return ['Biología'];
        return [];
      });               

      const resultado = await service.obtenerOpcionesFiltrosDisponibles('p1', 'u1', TipoFormulario.ESTUDIANTES);
      
      const filtros = resultado!.filtros_disponibles as Record<string, string[]>;

      expect(filtros.Carreras).toEqual(['Medicina']);
      expect(filtros.Géneros).toEqual(['Femenino']);
      expect(filtros.Sedes).toEqual(['Sede Central']);
      expect(filtros.Organizaciones).toEqual(['Empresa X']);
      expect(filtros.Asignaturas).toEqual(['Biología']);
      expect(filtros['Niveles formativos']).toBeUndefined();
    });

    it('debería usar estudiantes por defecto en el parámetro tipoFormulario', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({ formulario_estudiantes: {} });
      mockRepositorio.obtenerOpcionesDistintas.mockResolvedValue([]);

      await service.obtenerOpcionesFiltrosDisponibles('p1', 'u1');
      
      expect(mockProcesos.obtenerProcesoInterno).toHaveBeenCalledWith('u1', 'p1');
    });
    
    it('debería ejecutar la rama de SOCIOS para la configuración del formulario (Línea 153)', async () => {
      mockProcesos.obtenerProcesoInterno.mockResolvedValue({
        formulario_socios: { nombres_constructos: ['ConstructoSocio'] }
      });
      
      mockRepositorio.obtenerOpcionesDistintas.mockResolvedValue(['Dato']);
      const resultado = await service.obtenerOpcionesFiltrosDisponibles('p1', 'u1', TipoFormulario.SOCIOS);
      const filtros = resultado!.filtros_disponibles as Record<string, unknown>;
      expect(filtros.nombres_constructos).toEqual([{ id: 2, nombre: 'ConstructoSocio' }]);
    });
  });
});