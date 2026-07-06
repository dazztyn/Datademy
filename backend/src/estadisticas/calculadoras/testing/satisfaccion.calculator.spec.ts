import { SatisfaccionCalculator } from '../satisfaccion.calculator';
import { PreguntaAplanada } from '../../interfaces/pregunta-aplanada.interface';
import { Estadistica, DatosRespondente } from '../../schemas/estadisticas.schema';
import { PromedioMongoRaw } from '../../interfaces/metricas.interface';

describe('SatisfaccionCalculator', () => {
  let calculator: SatisfaccionCalculator;

  beforeEach(() => {
    calculator = new SatisfaccionCalculator();
  });

  describe('mapearNombreConstructo', () => {
    it('debería mapear el nombre si existe en el arreglo', () => {
      expect(calculator.mapearNombreConstructo(2, ['Liderazgo'])).toBe('Liderazgo');
    });
    it('debería usar nombre por defecto si no existe o es undefined', () => {
      expect(calculator.mapearNombreConstructo(3, ['Liderazgo'])).toBe('Constructo Página 3');
      expect(calculator.mapearNombreConstructo(4, null!)).toBe('Constructo Página 4'); 
    });
  });

  describe('formatearPromediosOptimizados', () => {
    it('debería filtrar por ultimaPagina y paginaFiltro', () => {
      const crudos: PromedioMongoRaw[] = [{ _id: 2, promedio_bruto: 5.5 }, { _id: 3, promedio_bruto: 6.0 }, { _id: 4, promedio_bruto: 7.0 }];
      const nombres = ['C1', 'C2', 'C3'];
      
      let result = calculator.formatearPromediosOptimizados(crudos, nombres, 4);
      expect(result.length).toBe(2); 

      result = calculator.formatearPromediosOptimizados(crudos, nombres, 4, 3);
      expect(result.length).toBe(1);
      expect(result[0].numero_pagina).toBe(3);
    });
  });

  describe('calcularPromediosPorPagina', () => {
    it('debería calcular el promedio e ignorar valores en cero', () => {
      const preguntas: PreguntaAplanada[] = [
        { numero_pagina: 2, pregunta: 'P1', respuesta_texto: '7', valor_numerico: 7 },
        { numero_pagina: 2, pregunta: 'P2', respuesta_texto: '6', valor_numerico: 6 },
        { numero_pagina: 2, pregunta: 'P3', respuesta_texto: '0', valor_numerico: 0 }, 
        { numero_pagina: 3, pregunta: 'P1', respuesta_texto: '7', valor_numerico: 7 },
      ];
      const result = calculator.calcularPromediosPorPagina(preguntas, ['A', 'B']);
      
      expect(result.length).toBe(2);
      expect(result.find(r => r.numero_pagina === 2)!.promedio_constructo).toBe(6.5);
    });
  });

  describe('calcularSatisfaccionGeneral', () => {
    it('debería retornar 0 si no hay preguntas', () => {
      expect(calculator.calcularSatisfaccionGeneral([])).toBe(0);
    });

    it('debería retornar 0 si nadie respondió en la última página', () => {
      const preguntas: PreguntaAplanada[] = [
        { numero_pagina: 3, pregunta: 'satisfacción general', respuesta_texto: '0', valor_numerico: 0 }
      ];
      expect(calculator.calcularSatisfaccionGeneral(preguntas)).toBe(0);
    });

    it('debería calcular con la pregunta exacta de satisfacción general', () => {
      const preguntas: PreguntaAplanada[] = [
        { numero_pagina: 3, pregunta: 'nivel de satisfacción general', respuesta_texto: '7', valor_numerico: 7 },
        { numero_pagina: 3, pregunta: 'nivel de satisfacción general', respuesta_texto: '6', valor_numerico: 6 },
      ];
      expect(calculator.calcularSatisfaccionGeneral(preguntas)).toBe(6.5);
    });

    it('debería usar el fallback y retornar 0 si no hay notas válidas', () => {
      const preguntas: PreguntaAplanada[] = [
        { numero_pagina: 3, pregunta: 'Otra', respuesta_texto: '0', valor_numerico: 0 },
        { numero_pagina: 3, pregunta: 'Otra2', respuesta_texto: '9', valor_numerico: 9 } 
      ];
      expect(calculator.calcularSatisfaccionGeneral(preguntas, 7)).toBe(0);
    });

    it('debería usar el fallback correctamente con notas válidas', () => {
      const preguntas: PreguntaAplanada[] = [
        { numero_pagina: 3, pregunta: 'Otra', respuesta_texto: '7', valor_numerico: 7 },
        { numero_pagina: 3, pregunta: 'Otra2', respuesta_texto: '5', valor_numerico: 5 } 
      ];
      expect(calculator.calcularSatisfaccionGeneral(preguntas, 7)).toBe(6.0);
    });
  });

  describe('calcularSatisfaccionPorAtributo', () => {
    it('debería ignorar atributos no especificados o nulos', () => {
      const mock: Partial<Estadistica>[] = [
        { datos_respondente: { carrera: 'No especificado' } as unknown as DatosRespondente },
        { datos_respondente: { carrera: 'No especificada' } as unknown as DatosRespondente },
        { datos_respondente: {} as unknown as DatosRespondente },
        { datos_respondente: { carrera: 'Medicina' } as unknown as DatosRespondente, constructos_paginas: undefined }
      ];
      expect(calculator.calcularSatisfaccionPorAtributo(mock, 3, 'carrera').length).toBe(0);
    });

    it('debería calcular promedios agrupados y ordenarlos correctamente de mayor a menor', () => {
      const mock: Partial<Estadistica>[] = [
        {
          datos_respondente: { carrera: 'Enfermería' } as unknown as DatosRespondente,
          constructos_paginas: [{ numero_pagina: 3, preguntas_pagina: [{ pregunta: '1', respuesta_texto: '5', valor_numerico: 5 }] }]
        },
        {
          datos_respondente: { carrera: 'Medicina' } as unknown as DatosRespondente,
          constructos_paginas: [{ numero_pagina: 3, preguntas_pagina: [{ pregunta: '1', respuesta_texto: '7', valor_numerico: 7 }] }]
        },
        {
          datos_respondente: { carrera: 'Odontología' } as unknown as DatosRespondente,
          constructos_paginas: [{ numero_pagina: 3, preguntas_pagina: [{ pregunta: '1', respuesta_texto: '6', valor_numerico: 6 }] }]
        }
      ];

      const result = calculator.calcularSatisfaccionPorAtributo(mock, 3, 'carrera');
      expect(result.length).toBe(3);
      expect(result[0].nombre).toBe('Medicina');
      expect(result[0].promedio).toBe(7.0);
      expect(result[2].nombre).toBe('Enfermería');
    });
  });

  describe('calcularDetallePreguntasPorDimension', () => {
    it('debería ignorar respuestas sin constructos', () => {
      expect(calculator.calcularDetallePreguntasPorDimension([{}], ['A']).length).toBe(0);
    });

    it('debería calcular detalles y frecuencias correctamente', () => {
      const mock: Partial<Estadistica>[] = [
        {
          constructos_paginas: [{
            numero_pagina: 2,
            preguntas_pagina: [
              { pregunta: 'Q1', respuesta_texto: '7', valor_numerico: 7 },
              { pregunta: 'Q2', respuesta_texto: '4', valor_numerico: 4 },
              { pregunta: 'Q3', respuesta_texto: '0', valor_numerico: 0 } 
            ]
          }]
        },
        {
          constructos_paginas: [{
            numero_pagina: 2,
            preguntas_pagina: [{ pregunta: 'Q1', respuesta_texto: '7', valor_numerico: 7 }]
          }]
        }
      ];

      const result = calculator.calcularDetallePreguntasPorDimension(mock, ['Liderazgo']);
      expect(result.length).toBe(1);
      expect(result[0].preguntas.length).toBe(2); 
      
      const q1 = result[0].preguntas.find(q => q.pregunta === 'Q1');
      expect(q1!.promedio).toBe(7.0);
      expect(q1!.distribucion_frecuencias[7]).toBe(2); 
      
      expect(result[0].pregunta_mayor_promedio!.pregunta).toBe('Q1');
      expect(result[0].pregunta_menor_promedio!.pregunta).toBe('Q2');
    });

    it('debería manejar arreglos vacíos de manera segura', () => {
      const mock: Partial<Estadistica>[] = [
        {
          constructos_paginas: [
            { numero_pagina: 2, preguntas_pagina: [] },
            { numero_pagina: 3, preguntas_pagina: undefined! } 
          ]
        }
      ];
      const result = calculator.calcularDetallePreguntasPorDimension(mock, []);
      expect(result.length).toBe(2);
      expect(result[0].preguntas.length).toBe(0);
      expect(result[0].pregunta_mayor_promedio).toBeNull();
    });
  });
});