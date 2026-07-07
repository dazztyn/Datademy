import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasWebhooksService } from '../estadisticas-webhooks.service';
import { ProcesosService } from '../../../formularios/services/procesos.service';
import { GoogleFormsService } from '../../../google/services/google-forms.service';
import { EstadisticasParserService } from '../estadisticas-parser.service';
import { EstadisticasRepository } from '../../estadisticas.repository';
import { CacheHelperService } from '../../../common/services/cache-helper.service';
import { NotFoundException } from '@nestjs/common';
import { TipoFormulario } from '../../../common/enum/tipo-formulario.enum';
import { ProcesoDocument } from '../../../formularios/schemas/proceso.schema';
import { forms_v1 } from 'googleapis';
import { GoogleFormDiseno } from '../../interfaces/diseno-google.interface';

describe('EstadisticasWebhooksService', () => {
    
  let service: EstadisticasWebhooksService;
  
  let mockProcesos: { buscarProcesosPorUsuarioYFormulario: jest.Mock; buscarTodosPorIdFormularioGoogle: jest.Mock; obtenerProcesoInterno: jest.Mock };
  let mockGoogleForms: { obtenerDisenoFormulario: jest.Mock; obtenerTodasLasRespuestas: jest.Mock };
  let mockParser: { adaptarDisenoGoogle: jest.Mock; adaptarRespuestaGoogle: jest.Mock; procesarEncuesta: jest.Mock };
  let mockRepo: { buscarPorQuery: jest.Mock; insertarMultiples: jest.Mock };
  let mockCache: { limpiarCacheGlobal: jest.Mock };

  beforeEach(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockProcesos = { 
      buscarProcesosPorUsuarioYFormulario: jest.fn(), 
      buscarTodosPorIdFormularioGoogle: jest.fn(), 
      obtenerProcesoInterno: jest.fn() 
    };
    
    mockGoogleForms = { 
      obtenerDisenoFormulario: jest.fn(), 
      obtenerTodasLasRespuestas: jest.fn() 
    };
    
    mockParser = { 
      adaptarDisenoGoogle: jest.fn(), 
      adaptarRespuestaGoogle: jest.fn(), 
      procesarEncuesta: jest.fn() 
    };
    
    mockRepo = { 
      buscarPorQuery: jest.fn(), 
      insertarMultiples: jest.fn() 
    };
    
    mockCache = { 
      limpiarCacheGlobal: jest.fn() 
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasWebhooksService,
        { provide: ProcesosService, useValue: mockProcesos },
        { provide: GoogleFormsService, useValue: mockGoogleForms },
        { provide: EstadisticasParserService, useValue: mockParser },
        { provide: EstadisticasRepository, useValue: mockRepo },
        { provide: CacheHelperService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<EstadisticasWebhooksService>(EstadisticasWebhooksService);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('manejarNuevoWebhookGoogle', () => {
    it('debería lanzar NotFoundException si no encuentra procesos asociados', async () => {
      mockProcesos.buscarTodosPorIdFormularioGoogle.mockResolvedValue([]);
      
      await expect(service.manejarNuevoWebhookGoogle('formX')).rejects.toThrow(NotFoundException);
    });

    it('debería procesar webhook automático saltando respuestas ya existentes y vacías', async () => {
      const mockProceso = { 
        _id: 'proc1', 
        usuario_id: 'u1', 
        formulario_estudiantes: { id_google_form: 'formX' } 
      } as unknown as ProcesoDocument;
      
      mockProcesos.buscarTodosPorIdFormularioGoogle.mockResolvedValue([mockProceso]);
      mockGoogleForms.obtenerDisenoFormulario.mockResolvedValue({} as forms_v1.Schema$Form);
      mockParser.adaptarDisenoGoogle.mockReturnValue({} as GoogleFormDiseno);
      
      mockRepo.buscarPorQuery.mockResolvedValueOnce([{ fecha_respuesta: new Date() }]);
      
      mockGoogleForms.obtenerTodasLasRespuestas.mockResolvedValue([
        { responseId: 'r_existente' },
        { responseId: 'r_nueva' }
      ] as forms_v1.Schema$FormResponse[]);

      mockRepo.buscarPorQuery.mockResolvedValueOnce([{ id_respuesta_google: 'r_existente' }]);
      
      mockParser.procesarEncuesta.mockReturnValue({ procesado: true });
      mockRepo.insertarMultiples.mockResolvedValue(['insertado1']);

      const res = await service.manejarNuevoWebhookGoogle('formX');
      
      expect(res.guardadas).toBe(1);
      expect(mockCache.limpiarCacheGlobal).toHaveBeenCalled();
    });

    it('debería procesar webhook manual para Socios, capturar error 11000 y saltar forms sin respuestas', async () => {
      const mockProcesoSocio = { 
        _id: 'proc2', 
        usuario_id: 'u2',
        formulario_estudiantes: { id_google_form: 'otro_form' }, 
        formulario_socios: { id_google_form: 'formSocios' } 
      } as unknown as ProcesoDocument;
      
      mockProcesos.buscarProcesosPorUsuarioYFormulario.mockResolvedValue([mockProcesoSocio]);
      mockGoogleForms.obtenerTodasLasRespuestas.mockResolvedValueOnce([]); 
      mockGoogleForms.obtenerTodasLasRespuestas.mockResolvedValueOnce([{ responseId: 'r_socio' }]);
      mockRepo.buscarPorQuery.mockResolvedValue([]);
      
      mockRepo.insertarMultiples.mockRejectedValue({ code: 11000 });

      const procesosDobles = [mockProcesoSocio, mockProcesoSocio];
      mockProcesos.buscarProcesosPorUsuarioYFormulario.mockResolvedValue(procesosDobles);

      const res = await service.manejarNuevoWebhookGoogle('formSocios', true, 'u2');
      
      expect(res.guardadas).toBe(0); 
    });

    it('debería propagar errores críticos distintos a 11000', async () => {
      const mockProceso = { _id: 'p3', formulario_estudiantes: { id_google_form: 'formError' } } as unknown as ProcesoDocument;
      mockProcesos.buscarTodosPorIdFormularioGoogle.mockResolvedValue([mockProceso]);
      mockGoogleForms.obtenerTodasLasRespuestas.mockResolvedValue([{ responseId: 'r1' }]);
      mockRepo.buscarPorQuery.mockResolvedValue([]); // Nada en DB
      
      // Simula caída de base de datos
      mockRepo.insertarMultiples.mockRejectedValue(new Error('Fatal DB Error'));

      await expect(service.manejarNuevoWebhookGoogle('formError')).rejects.toThrow('Fatal DB Error');
    });
  });

  describe('sincronizarProcesoManual', () => {
    it('debería sincronizar ambos formularios si existen y sumar las cantidades', async () => {
      const mockProcesoCompleto = {
        formulario_estudiantes: { id_google_form: 'formE' },
        formulario_socios: { id_google_form: 'formS' }
      } as unknown as ProcesoDocument;

      mockProcesos.obtenerProcesoInterno.mockResolvedValue(mockProcesoCompleto);
      
      // Interceptamos la función interna con jest.spyOn para que no se ejecute completa
      jest.spyOn(service, 'manejarNuevoWebhookGoogle')
        .mockResolvedValueOnce({ estado: 'exito', guardadas: 3 })
        .mockResolvedValueOnce({ estado: 'exito', guardadas: 2 });

      const res = await service.sincronizarProcesoManual('p1', 'u1');

      expect(res.total_nuevas_guardadas).toBe(5);
      expect(res.detalle.length).toBe(2);
    });

    it('debería manejar procesos sin formularios configurados sin fallar', async () => {
      const mockProcesoVacio = {} as unknown as ProcesoDocument;
      mockProcesos.obtenerProcesoInterno.mockResolvedValue(mockProcesoVacio);

      const res = await service.sincronizarProcesoManual('p_vacio', 'u_vacio');

      expect(res.total_nuevas_guardadas).toBe(0);
      expect(res.detalle.length).toBe(0);
    });
  });
});