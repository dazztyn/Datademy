import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasExportacionService } from '../estadisticas-exportacion.service';
import { EstadisticasRepository } from '../../estadisticas.repository';
import { Estadistica, RespuestaPregunta } from '../../schemas/estadisticas.schema';
import { TipoFormulario } from '../../../common/enum/tipo-formulario.enum';

describe('EstadisticasExportacionService', () => {
  let service: EstadisticasExportacionService;
  let mockRepositorio: { buscarPorQuery: jest.Mock };

  beforeEach(async () => {
    mockRepositorio = { buscarPorQuery: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasExportacionService,
        { provide: EstadisticasRepository, useValue: mockRepositorio }
      ]
    }).compile();

    service = module.get<EstadisticasExportacionService>(EstadisticasExportacionService);
  });

  describe('extraerFeedbackAgrupadoParaInforme', () => {

    it('debería rechazar payload nulo o sin idProceso (Seguridad)', async () => {
      const res1 = await service.extraerFeedbackAgrupadoParaInforme(null as unknown as { idProceso: string });
      const res2 = await service.extraerFeedbackAgrupadoParaInforme({} as unknown as { idProceso: string });
      
      expect(res1).toEqual({});
      expect(res2).toEqual({});
      expect(mockRepositorio.buscarPorQuery).not.toHaveBeenCalled();
    });

    it('debería ejecutar la búsqueda sin filtros adicionales si no se proveen o están vacíos', async () => {
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);
      
      await service.extraerFeedbackAgrupadoParaInforme({ idProceso: 'p1' });
      expect(mockRepositorio.buscarPorQuery).toHaveBeenCalledWith(
        { proceso_id: 'p1' },
        'tipo_formulario constructos_paginas datos_respondente'
      );

      await service.extraerFeedbackAgrupadoParaInforme({ idProceso: 'p1', filtros: { carrera: '' } });
      expect(mockRepositorio.buscarPorQuery).toHaveBeenCalledTimes(2);
    });

    it('debería mapear filtros correctamente usando MAPA_FILTROS_MONGO y filtros no mapeados', async () => {
      mockRepositorio.buscarPorQuery.mockResolvedValue([]);
      
      await service.extraerFeedbackAgrupadoParaInforme({ 
        idProceso: 'p1', 
        filtros: { 
          carrera: 'Ingeniería', 
          filtro_desconocido: 'ValorX' 
        } 
      });

      expect(mockRepositorio.buscarPorQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: expect.arrayContaining([
            { $or: expect.arrayContaining([{ 'datos_respondente.carrera': 'Ingeniería' }]) },
            { $or: expect.arrayContaining([{ 'filtro_desconocido': 'ValorX' }]) }
          ])
        }),
        'tipo_formulario constructos_paginas datos_respondente'
      );
    });

    it('debería procesar estudiantes con fortalezas y mejoras, omitiendo strings inválidos', async () => {
      const mockStats = [
        {
          tipo_formulario: TipoFormulario.ESTUDIANTES,
          constructos_paginas: [
            {
              preguntas_pagina: [
                { valor_numerico: 0, respuesta_texto: 'Buena enseñanza' }, 
                { valor_numerico: 0, respuesta_texto: 'Más horas prácticas' } 
              ]
            }
          ]
        },
        {
          tipo_formulario: TipoFormulario.ESTUDIANTES,
          constructos_paginas: [
            {
              preguntas_pagina: [
                { valor_numerico: 0, respuesta_texto: 'X' }, 
                { valor_numerico: 0, respuesta_texto: 'Sin respuesta' } 
              ]
            }
          ]
        }
      ] as unknown as Estadistica[];

      mockRepositorio.buscarPorQuery.mockResolvedValue(mockStats);
      
      const resultado = await service.extraerFeedbackAgrupadoParaInforme({ idProceso: 'p1' });
      
      expect(resultado.feedback_estudiantes_fortalezas).toContain('Buena enseñanza');
      expect(resultado.feedback_estudiantes_mejoras).toContain('Más horas prácticas');
      expect(resultado.feedback_estudiantes_fortalezas).not.toContain('X'); 
    });

    it('debería procesar estudiantes con solo 1 pregunta de texto y tipos de formulario inválidos', async () => {
      const mockStats = [
        {
          tipo_formulario: TipoFormulario.ESTUDIANTES,
          constructos_paginas: [
            {
              preguntas_pagina: [
                { valor_numerico: 0, respuesta_texto: 'Única mejora de estudiante' } 
              ]
            }
          ]
        },
        {
          tipo_formulario: 'inválido_desconocido',
          constructos_paginas: [
            {
              preguntas_pagina: [
                { valor_numerico: 0, respuesta_texto: 'Texto ignorado' },
              ]
            }
          ]
        }
      ] as unknown as Estadistica[];

      mockRepositorio.buscarPorQuery.mockResolvedValue(mockStats);
      
      const resultado = await service.extraerFeedbackAgrupadoParaInforme({ idProceso: 'p1' });
      
      expect(resultado.feedback_estudiantes_mejoras).toContain('Única mejora de estudiante');
    });

    it('debería procesar socios, generar lista y manejar fallbacks', async () => {
      const mockStats = [
        {
          tipo_formulario: TipoFormulario.SOCIOS,
          datos_respondente: { nombre: '', organizacion: undefined as unknown as string }, 
          constructos_paginas: [
            {
              preguntas_pagina: [
                { valor_numerico: 0, respuesta_texto: 'Comunicación fluida' },
                { valor_numerico: 0, respuesta_texto: 'Mejorar procesos' } 
              ]
            },
            {
              preguntas_pagina: undefined as unknown as RespuestaPregunta[]
            }
          ]
        },
        {
          tipo_formulario: TipoFormulario.SOCIOS,
          datos_respondente: { nombre: 'Juan', organizacion: 'Empresa Y' },
          constructos_paginas: undefined 
        }
      ] as unknown as Estadistica[];

      mockRepositorio.buscarPorQuery.mockResolvedValue(mockStats);
      
      const resultado = await service.extraerFeedbackAgrupadoParaInforme({ idProceso: 'p1' });
      
      expect(resultado.lista_socios_comunitarios).toContain('Organización no especificada');
      expect(resultado.lista_socios_comunitarios).toContain('Empresa Y');
      expect(resultado.feedback_socios_fortalezas).toContain('Comunicación fluida');
    });

    it('debería cubrir el return de la línea 61 (sin preguntas de texto)', async () => {
      const mockStats = [
        {
          tipo_formulario: TipoFormulario.ESTUDIANTES,
          constructos_paginas: [
            {
              preguntas_pagina: [
                { valor_numerico: 5, respuesta_texto: 'Numérica 1' },
                { valor_numerico: 7, respuesta_texto: 'Numérica 2' }
              ]
            }
          ]
        }
      ] as unknown as Estadistica[];

      mockRepositorio.buscarPorQuery.mockResolvedValue(mockStats);
      
      const resultado = await service.extraerFeedbackAgrupadoParaInforme({ idProceso: 'p1' });
      expect(resultado.feedback_estudiantes_fortalezas).toBe('No se registraron fortalezas.');
      expect(resultado.feedback_estudiantes_mejoras).toBe('No se registraron oportunidades de mejora.');
    });
  });
});