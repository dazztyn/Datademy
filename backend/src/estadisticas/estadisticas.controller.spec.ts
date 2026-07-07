import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasWebhooksService } from './services/estadisticas-webhooks.service';
import { EstadisticasConsultasService } from './services/estadisticas-consultas.service';
import { EstadisticasComparativasService } from './services/estadisticas-comparativas.service';
import { BadRequestException } from '@nestjs/common';
import { TipoFormulario } from '../common/enum/tipo-formulario.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RequestConUsuario } from '../auth/interfaces/request-con-usuario.interface';

interface MockRequest {
  user: { userId: string };
}

describe('EstadisticasController', () => {
  let controller: EstadisticasController;
  let mockWebhooks: { sincronizarProcesoManual: jest.Mock };
  let mockConsultas: { obtenerResultadosTabulares: jest.Mock; obtenerMetricasAnaliticas: jest.Mock; obtenerOpcionesFiltrosDisponibles: jest.Mock };
  let mockComparativas: { obtenerComparativaGlobal: jest.Mock; obtenerComparativaInterna: jest.Mock };

  const mockReq = {
    user: { userId: 'usuario-123' }
  } as unknown as RequestConUsuario;

  beforeEach(async () => {
    mockWebhooks = { sincronizarProcesoManual: jest.fn() };
    mockConsultas = { 
      obtenerResultadosTabulares: jest.fn(), 
      obtenerMetricasAnaliticas: jest.fn(), 
      obtenerOpcionesFiltrosDisponibles: jest.fn() 
    };
    mockComparativas = { 
      obtenerComparativaGlobal: jest.fn(), 
      obtenerComparativaInterna: jest.fn() 
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstadisticasController],
      providers: [
        { provide: EstadisticasWebhooksService, useValue: mockWebhooks },
        { provide: EstadisticasConsultasService, useValue: mockConsultas },
        { provide: EstadisticasComparativasService, useValue: mockComparativas },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } }, 
      ],
    }).compile();

    controller = module.get<EstadisticasController>(EstadisticasController);
  });

  describe('obtenerComparativaGlobal', () => {
    it('debería rechazar si no se envían procesos', async () => {
      await expect(controller.obtenerComparativaGlobal(mockReq, ''))
        .rejects.toThrow(BadRequestException);
    });

    it('debería dividir la URL y llamar al servicio con el Tipo correcto', async () => {
      mockComparativas.obtenerComparativaGlobal.mockResolvedValue('ok');
      const resultado = await controller.obtenerComparativaGlobal(mockReq, 'p1,p2', TipoFormulario.SOCIOS);
      
      expect(mockComparativas.obtenerComparativaGlobal).toHaveBeenCalledWith('usuario-123', ['p1', 'p2'], TipoFormulario.SOCIOS);
      expect(resultado).toBe('ok');
    });

    it('debería usar ESTUDIANTES como fallback si no se especifica el tipo', async () => {
      await controller.obtenerComparativaGlobal(mockReq, 'p1,p2');
      expect(mockComparativas.obtenerComparativaGlobal).toHaveBeenCalledWith('usuario-123', ['p1', 'p2'], TipoFormulario.ESTUDIANTES);
    });
  });

  describe('sincronizarDatosManualmente', () => {
    it('debería llamar al webhook service', async () => {
      mockWebhooks.sincronizarProcesoManual.mockResolvedValue('sincronizado');
      const resultado = await controller.sincronizarDatosManualmente(mockReq, 'proc1');
      expect(mockWebhooks.sincronizarProcesoManual).toHaveBeenCalledWith('proc1', 'usuario-123');
      expect(resultado).toBe('sincronizado');
    });
  });

  describe('obtenerResultadosFrontend', () => {
    it('debería cubrir la rama de filtros presentes y vacíos', async () => {
      mockConsultas.obtenerResultadosTabulares.mockResolvedValue('ok');
      
      await controller.obtenerResultadosFrontend(mockReq, 'p1', { carrera: 'Informatica' });
      await controller.obtenerResultadosFrontend(mockReq, 'p1', {});
      
      expect(mockConsultas.obtenerResultadosTabulares).toHaveBeenCalledTimes(2);
    });
  });

  describe('obtenerMetricasFrontend', () => {
    it('debería cubrir el camino verdadero (con página) y falso (sin página)', async () => {
      mockConsultas.obtenerMetricasAnaliticas.mockResolvedValue('ok');
      
      await controller.obtenerMetricasFrontend(mockReq, 'p1', { pagina: '2' });
      await controller.obtenerMetricasFrontend(mockReq, 'p1', {});
      
      expect(mockConsultas.obtenerMetricasAnaliticas).toHaveBeenCalledTimes(2);
    });
  });

  describe('obtenerOpcionesFiltros', () => {
    it('debería aplicar ESTUDIANTES como fallback si no envían tipo', async () => {
      await controller.obtenerOpcionesFiltros(mockReq, 'proc1');
      expect(mockConsultas.obtenerOpcionesFiltrosDisponibles).toHaveBeenCalledWith('proc1', 'usuario-123', TipoFormulario.ESTUDIANTES);
    });
  });

  describe('obtenerComparativaInterna', () => {
    it('debería cubrir el camino verdadero (con tipo) y falso (sin tipo)', async () => {
      mockComparativas.obtenerComparativaInterna.mockResolvedValue('ok');
      
      await controller.obtenerComparativaInterna(mockReq, 'p1', { agruparPor: 'carrera', tipo: TipoFormulario.SOCIOS } as any);
      await controller.obtenerComparativaInterna(mockReq, 'p1', { agruparPor: 'carrera' } as any);
      
      expect(mockComparativas.obtenerComparativaInterna).toHaveBeenCalledTimes(2);
    });

    it('debería cubrir el camino verdadero (con valores) y falso (sin valores)', async () => {
      mockComparativas.obtenerComparativaInterna.mockResolvedValue('ok');
      
      await controller.obtenerComparativaInterna(mockReq, 'p1', { agruparPor: 'carrera', valores: 'a,b' } as any);
      await controller.obtenerComparativaInterna(mockReq, 'p1', { agruparPor: 'carrera' } as any);
      
      expect(mockComparativas.obtenerComparativaInterna).toHaveBeenCalledTimes(2);
    });
    
    it('debería lanzar BadRequestException cuando agruparPor no está presente (Cubre línea 102)', async () => {
      const params = {
        valores: 'a,b',
        tipo: TipoFormulario.ESTUDIANTES
      } as any; 

      await expect(controller.obtenerComparativaInterna(mockReq, 'p1', params))
        .rejects.toThrow(BadRequestException);
    });
  });
});