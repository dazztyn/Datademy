import { EstadisticasParserService } from '../estadisticas-parser.service';
import { GoogleFormDiseno } from '../../interfaces/diseno-google.interface';
import { GoogleFormRespuesta, AnswerItem } from '../../interfaces/respuesta-google.interface';
import { forms_v1 } from 'googleapis';

describe('EstadisticasParserService', () => {
  let service: EstadisticasParserService;

  beforeEach(() => {
    service = new EstadisticasParserService();
  });

  describe('adaptarDisenoGoogle (Cobertura de Líneas 109, 115 y 116)', () => {
    it('debería ejecutar todas las ramas ternarias y fallbacks internos', () => {
      const disenoExtremo = {
        items: [
          { title: 'T1', pageBreakItem: {}, questionItem: { question: { questionId: 'q1', choiceQuestion: { options: [{ value: 'Opt1' }] } } } },
          { title: undefined, pageBreakItem: undefined, questionItem: undefined },
          { title: '', pageBreakItem: null, questionItem: null },
          { questionItem: { question: { choiceQuestion: { options: [{ value: null as unknown as string }] } } } },
          { questionItem: { question: {} } },
          { questionItem: { question: { choiceQuestion: {} } } }
        ]
      } as unknown as forms_v1.Schema$Form;

      const resultado = service.adaptarDisenoGoogle(disenoExtremo);
      
      expect(resultado.items!.length).toBe(6);
      expect(resultado.items![4].questionItem!.question.choiceQuestion).toBeUndefined();
      expect(resultado.items![5].questionItem!.question.choiceQuestion!.options).toEqual([]); 
    });

    it('debería cubrir el fallback de diseno sin items (Línea 109)', () => {
      const disenoSinItems = {} as unknown as forms_v1.Schema$Form;
      const resultado = service.adaptarDisenoGoogle(disenoSinItems);
      
      expect(resultado.items).toEqual([]); 
    });
  });

  describe('adaptarRespuestaGoogle', () => {
    it('debería adaptar respuestas y manejar fallbacks en los map', () => {
      const mockExtremo = {
        responseId: 'resp123',
        createTime: '2026-07-06T12:00:00Z',
        answers: {
          'q1': { textAnswers: { answers: [{ value: 'Respuesta A' }] } },
          'q2': {},
          'q3': { textAnswers: { answers: [{ value: null as unknown as string }] } } 
        }
      } as unknown as forms_v1.Schema$FormResponse;

      const resultado = service.adaptarRespuestaGoogle(mockExtremo);
      
      expect(resultado.responseId).toBe('resp123');
      expect(resultado.createTime).toBe('2026-07-06T12:00:00Z');
      expect(resultado.answers['q1'].textAnswers.answers[0].value).toBe('Respuesta A');
      expect(resultado.answers['q2'].textAnswers.answers).toEqual([]);
      expect(resultado.answers['q3'].textAnswers.answers[0].value).toBe('');
    });

    it('debería manejar respuestas totalmente vacías o indefinidas', () => {
      const mockVacio = {} as unknown as forms_v1.Schema$FormResponse;
      const resultado = service.adaptarRespuestaGoogle(mockVacio);
      
      expect(resultado.responseId).toBe('');
      expect(resultado.createTime).toBeUndefined();
      expect(resultado.answers).toEqual({});
    });
  });

  describe('procesarEncuesta', () => {
    it('debería procesar encuesta completa, calcular numéricos y ejecutar el sort() (Línea 96)', () => {
      const diseno: GoogleFormDiseno = {
        items: [
          { title: 'Carrera', questionItem: { question: { questionId: 'q_carrera' } } },
          { title: 'Variable Rara', questionItem: { question: { questionId: 'q_rara' } } },
          { pageBreakItem: {} },
          {
            title: 'Pregunta Likert 1',
            questionItem: { question: { questionId: 'q_likert_1', choiceQuestion: { options: [{ value: 'Malo' }, { value: 'Bueno' }, { value: 'Excelente' }] } } }
          },
          {
            title: 'Pregunta Likert 2', 
            questionItem: { question: { questionId: 'q_likert_2', choiceQuestion: { options: [{ value: 'Malo' }, { value: 'Bueno' }, { value: 'Excelente' }] } } }
          }
        ]
      };

      const respuesta: GoogleFormRespuesta = {
        responseId: 'r1',
        createTime: '2026-07-06T12:00:00Z', 
        answers: {
          'q_carrera': { textAnswers: { answers: [{ value: '  ingeniería   civil  ' }] } },
          'q_rara': { textAnswers: { answers: [{ value: 'dato extra' }] } },
          'q_likert_1': { textAnswers: { answers: [{ value: 'Bueno' }] } },
          'q_likert_2': { textAnswers: { answers: [{ value: 'Excelente' }] } }
        }
      };

      const resultado = service.procesarEncuesta(diseno, respuesta, 'r1', 'u1', 'p1');

      expect(resultado.fecha_respuesta).toBeInstanceOf(Date);
      expect(resultado.datos_respondente.carrera).toBe('Ingeniería Civil');
      expect(resultado.datos_respondente.metadatos_adicionales!.get('Variable Rara')).toBe('Dato Extra');
      expect(resultado.constructos_paginas[0].preguntas_pagina.length).toBe(2);
      expect(resultado.constructos_paginas[0].preguntas_pagina[0].valor_numerico).toBe(2);
    });

    it('debería cubrir fallbacks al recibir objetos completamente vacíos', () => {
      const disenoVacio = {} as unknown as GoogleFormDiseno;
      const respuestaVacia = { responseId: 'r1', answers: {} } as unknown as GoogleFormRespuesta;

      const resultado = service.procesarEncuesta(disenoVacio, respuestaVacia, 'r1', 'u1', 'p1');
      
      expect(resultado.constructos_paginas).toEqual([]);
      expect(resultado.fecha_respuesta).toBeInstanceOf(Date); 
    });

    it('debería cubrir "Sin título" y arreglos de opciones vacíos', () => {
      const disenoIncompleto: GoogleFormDiseno = {
        items: [
          {
            questionItem: {
              question: { questionId: 'q_incompleta' }
            }
          }
        ]
      };

      const respuestaIncompleta = {
        responseId: 'r2',
        answers: {
          'q_incompleta': {} as unknown as AnswerItem 
        }
      } as unknown as GoogleFormRespuesta;

      const resultado = service.procesarEncuesta(disenoIncompleto, respuestaIncompleta, 'r2', 'u1', 'p1');
      
      expect(resultado.datos_respondente.metadatos_adicionales!.get('Sin título')).toBe('Sin respuesta');
    });

    it('debería cubrir el fallback de textAnswers vacío en procesarConstructos', () => {
      const disenoConstructo: GoogleFormDiseno = {
        items: [
          { pageBreakItem: {} },
          {
            title: 'Likert',
            questionItem: { question: { questionId: 'q_likert', choiceQuestion: { options: [] } } }
          }
        ]
      };
      
      const respuestaVacia: GoogleFormRespuesta = {
        responseId: 'r3',
        answers: {
          'q_likert': {
            textAnswers: { answers: [] } 
          }
        }
      };

      const resultado = service.procesarEncuesta(disenoConstructo, respuestaVacia, 'r3', 'u1', 'p1');
      
      expect(resultado.constructos_paginas[0].preguntas_pagina[0].respuesta_texto).toBe('Sin respuesta');
      expect(resultado.constructos_paginas[0].preguntas_pagina[0].valor_numerico).toBe(0);
    });

    it('debería normalizar strings vacíos (Cobertura de método privado)', () => {
      expect(service['normalizarTexto']('')).toBe('Sin respuesta');
    });
  });
});