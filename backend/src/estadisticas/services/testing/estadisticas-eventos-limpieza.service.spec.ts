import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasEventosLimpiezaService } from '../estadisticas-eventos-limpieza.service';
import { EstadisticasRepository } from '../../estadisticas.repository';
import { CacheHelperService } from '../../../common/services/cache-helper.service';

describe('EstadisticasEventosLimpiezaService', () => {
  let service: EstadisticasEventosLimpiezaService;

  const mockRepositorio = {
    eliminarRespuestasPorProceso: jest.fn(),
    eliminarEstadisticasPorFiltro: jest.fn(),
  };

  const mockCache = {
    limpiarCacheGlobal: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasEventosLimpiezaService,
        { provide: EstadisticasRepository, useValue: mockRepositorio },
        { provide: CacheHelperService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<EstadisticasEventosLimpiezaService>(EstadisticasEventosLimpiezaService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('limpiarDatosHuerfanos', () => {
    it('debería limpiar datos cuando se envía un procesoId válido', async () => {
      await service.limpiarDatosHuerfanos({ procesoId: 'proc123' });
      
      expect(mockRepositorio.eliminarRespuestasPorProceso).toHaveBeenCalledWith('proc123');
      expect(mockCache.limpiarCacheGlobal).toHaveBeenCalled();
    });

    it('debería ignorar la ejecución si el payload completo es nulo (Rama 1)', async () => {
    await service.limpiarDatosHuerfanos(null as unknown as { procesoId: string });
    expect(mockRepositorio.eliminarRespuestasPorProceso).not.toHaveBeenCalled();
    });

    it('debería ignorar la ejecución si el payload es un objeto vacío (Rama 2)', async () => {
      await service.limpiarDatosHuerfanos({} as { procesoId: string });
      expect(mockRepositorio.eliminarRespuestasPorProceso).not.toHaveBeenCalled();
    });
    
  });

  describe('limpiarEstadisticasHuerfanas', () => {
    it('debería limpiar estadísticas cuando se envían datos válidos', async () => {
      await service.limpiarEstadisticasHuerfanas({ procesoId: 'proc123', tipoFormulario: 'estudiantes' });
      
      expect(mockRepositorio.eliminarEstadisticasPorFiltro).toHaveBeenCalledWith({
        proceso_id: 'proc123',
        tipo_formulario: 'estudiantes'
      });
      expect(mockCache.limpiarCacheGlobal).toHaveBeenCalled();
    });

    it('debería ignorar la ejecución si el payload completo es nulo (Rama 1)', async () => {
    await service.limpiarEstadisticasHuerfanas(null as unknown as { procesoId: string, tipoFormulario: string });
    expect(mockRepositorio.eliminarEstadisticasPorFiltro).not.toHaveBeenCalled();
    });

    it('debería ignorar la ejecución si al payload le faltan datos (Rama 2)', async () => {
      await service.limpiarEstadisticasHuerfanas({ procesoId: '123' } as { procesoId: string, tipoFormulario: string });
      expect(mockRepositorio.eliminarEstadisticasPorFiltro).not.toHaveBeenCalled();
    });
  });
  describe('Pruebas exhaustivas de ramas if (Sin Any)', () => {
    it('limpiarDatosHuerfanos: debería rechazar payload nulo', async () => {
      await service.limpiarDatosHuerfanos(null as unknown as { procesoId: string });
      expect(mockRepositorio.eliminarRespuestasPorProceso).not.toHaveBeenCalled();
    });

    it('limpiarDatosHuerfanos: debería rechazar payload sin procesoId', async () => {
      await service.limpiarDatosHuerfanos({} as unknown as { procesoId: string });
      expect(mockRepositorio.eliminarRespuestasPorProceso).not.toHaveBeenCalled();
    });

    it('limpiarEstadisticasHuerfanas: debería rechazar payload nulo', async () => {
      await service.limpiarEstadisticasHuerfanas(null as unknown as { procesoId: string, tipoFormulario: string });
      expect(mockRepositorio.eliminarEstadisticasPorFiltro).not.toHaveBeenCalled();
    });

    it('limpiarEstadisticasHuerfanas: debería rechazar payload sin tipoFormulario', async () => {
      await service.limpiarEstadisticasHuerfanas({ procesoId: '123' } as unknown as { procesoId: string, tipoFormulario: string });
      expect(mockRepositorio.eliminarEstadisticasPorFiltro).not.toHaveBeenCalled();
    });

    it('limpiarEstadisticasHuerfanas: debería rechazar payload sin procesoId', async () => {
      await service.limpiarEstadisticasHuerfanas({ tipoFormulario: 'estudiantes' } as unknown as { procesoId: string, tipoFormulario: string });
      expect(mockRepositorio.eliminarEstadisticasPorFiltro).not.toHaveBeenCalled();
    });
  });
});