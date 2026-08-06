import { EstadisticasFormatterService } from '../estadisticas-formatter.service';
import { Estadistica, DatosRespondente } from '../../schemas/estadisticas.schema';
import { PaginaConstructo, RespuestaPregunta } from '../../interfaces/pagina-constructo.interface';

describe('EstadisticasFormatterService', () => {
  let service: EstadisticasFormatterService;

  beforeEach(() => {
    service = new EstadisticasFormatterService();
  });

  describe('formatearParaFrontend', () => {
    it('debería aplanar correctamente los datos complejos para la tabla del frontend', () => {
      const fechaMock = new Date('2026-07-05T00:00:00Z');
      const mockEstadisticas: Partial<Estadistica>[] = [
        {
          id_respuesta_google: 'google123',
          fecha_respuesta: fechaMock,
          datos_respondente: {
            carrera: 'Psicología',
            genero: 'Femenino',
            metadatos_adicionales: { variable_extra: '123' } 
          } as unknown as DatosRespondente,
          constructos_paginas: [
            {
              numero_pagina: 2,
              preguntas_pagina: [
                { pregunta: 'Q1', respuesta_texto: 'Muy de acuerdo' } as RespuestaPregunta
              ]
            } as PaginaConstructo
          ]
        }
      ];

      const resultado = service.formatearParaFrontend(mockEstadisticas as Estadistica[]);
      
      expect(resultado.length).toBe(1);
      
      expect(resultado[0]).toEqual(expect.objectContaining({
        id_respuesta: 'google123',
        carrera: 'Psicología',
        genero: 'Femenino',
        Q1: 'Muy de acuerdo',
        variable_extra: '123',
        edad: 'No especificado'
      }));
    });

    it('debería manejar arreglos vacíos o indefinidos gracias a sus mecanismos de defensa', () => {
      const mockIncompleto: Partial<Estadistica>[] = [
        {
          id_respuesta_google: 'google456',
          fecha_respuesta: new Date(),
          datos_respondente: undefined,
          constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: undefined! } 
          ]
        },
        {
          id_respuesta_google: 'google789',
          fecha_respuesta: new Date(),
          constructos_paginas: undefined 
        }
      ];

      const resultado = service.formatearParaFrontend(mockIncompleto as Estadistica[]);
      
      expect(resultado.length).toBe(2);
      
      expect(resultado[0]).toEqual(expect.objectContaining({
        id_respuesta: 'google456',
        carrera: 'No especificado'
      }));
      
      expect(resultado[1]).toEqual(expect.objectContaining({
        id_respuesta: 'google789'
      }));
    });
  });
});