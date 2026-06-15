import { Test, TestingModule } from '@nestjs/testing';
import { EstadisticasService } from './estadisticas.service';

describe('EstadisticasService', () => {
  let service: EstadisticasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstadisticasService],
    }).compile();

    service = module.get<EstadisticasService>(EstadisticasService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('calcularMetricasAnaliticas', () => {
    it('debería devolver métricas en cero si no hay respuestas en la BD', () => {
      const resultado = service.calcularMetricasAnaliticas([], ['Constructo 1'], 10);
      
      expect(resultado.total_esperados).toBe(10);
      expect(resultado.total_encuestados).toBe(0);
      expect(resultado.tasa_respuesta_porcentaje).toBe(0);
      expect(resultado.promedios_por_pagina.length).toBe(0);
    });

    it('debería calcular correctamente la tasa de respuesta y promedios generales', () => {
      // Simulamos 2 encuestados de 4 esperados (Debería ser 50%)
      const mockEstadisticasBD = [
        { datos_respondente: { genero: 'Femenino' } },
        { datos_respondente: { genero: 'Femenino' } }
      ];

      const resultado = service.calcularMetricasAnaliticas(mockEstadisticasBD, [], 4);

      expect(resultado.total_encuestados).toBe(2);
      expect(resultado.tasa_respuesta_porcentaje).toBe(50);
      expect(resultado.distribucion_genero['Femenino']).toBe(2);
    });

    it('debería calcular el Alfa de Cronbach correctamente (Escenario de Correlación Perfecta)', () => {
      // Matemáticamente, si todos los encuestados responden con el mismo patrón (ej. puro 5, puro 4, puro 3)
      // la varianza de los ítems respecto a la total hace que el Alfa de Cronbach sea exactamente 1.0
      const mockCorrelacionPerfecta = [
        {
          constructos_paginas: [
            {
              numero_pagina: 2, // Página a evaluar
              preguestas_pagina: [
                { pregunta: 'P1', valor_numerico: 5 },
                { pregunta: 'P2', valor_numerico: 5 },
                { pregunta: 'P3', valor_numerico: 5 },
              ]
            },
            // Agregamos una pregunta ficticia para que el sistema detecte esta como la última página
            { numero_pagina: 3, preguestas_pagina: [{ pregunta: 'Feedback final', valor_numerico: 0 }] } 
          ]
        },
        {
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguestas_pagina: [
                { pregunta: 'P1', valor_numerico: 4 },
                { pregunta: 'P2', valor_numerico: 4 },
                { pregunta: 'P3', valor_numerico: 4 },
              ]
            },
            { numero_pagina: 3, preguestas_pagina: [{ pregunta: 'Feedback final', valor_numerico: 0 }] }
          ]
        },
        {
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguestas_pagina: [
                { pregunta: 'P1', valor_numerico: 3 },
                { pregunta: 'P2', valor_numerico: 3 },
                { pregunta: 'P3', valor_numerico: 3 },
              ]
            },
            { numero_pagina: 3, preguestas_pagina: [{ pregunta: 'Feedback final', valor_numerico: 0 }] }
          ]
        }
      ];

      const resultado = service.calcularMetricasAnaliticas(mockCorrelacionPerfecta, ['Liderazgo'], 10);

      const fiabilidadPagina2 = resultado.fiabilidad_constructos.find(f => f.numero_pagina === 2);
      
      expect(fiabilidadPagina2).toBeDefined();
      expect(fiabilidadPagina2?.nombre_constructo).toBe('Liderazgo');
      
      expect(fiabilidadPagina2?.alfa_cronbach_global).toBe(1.0);
    });
  });

  describe('Extracción y Normalización de Datos', () => {
    // Para probar un método privado indirectamente, usamos el formateador público
    it('debería aplanar las preguntas y manejar campos demográficos vacíos', () => {
      const mockDb = [
        {
          id_respuesta_google: 'google_123',
          fecha_respuesta: new Date('2026-06-10'),
          datos_respondente: { genero: 'Femenino', carrera: 'Ingeniería Civil' },
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguestas_pagina: [ { pregunta: '¿Te gustó el taller?', valor_numerico: 5 } ]
            }
          ]
        }
      ];

      const resultado = service.formatearParaFrontend(mockDb);

      expect(resultado[0].id_respuesta).toBe('google_123');
      expect(resultado[0].genero).toBe('Femenino');
      expect(resultado[0].sede).toBe('No especificado'); 
      expect(resultado[0]['¿Te gustó el taller?']).toBe(5);
    });
  });
});