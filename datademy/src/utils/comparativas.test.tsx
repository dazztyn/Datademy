import { describe, it, expect } from 'vitest'
import { interpretarAlfa, interpretarNps, normalizarAlfas, normalizarPromedios } from './comparativas'
import type { ComparativaAlfa, ComparativaPromedio } from '../services/estadisticos_service'

describe('interpretarAlfa', () => {
  it('clasifica como Excelente desde 0.9', () => {
    expect(interpretarAlfa(0.9).texto).toBe('Excelente')
    expect(interpretarAlfa(0.95).texto).toBe('Excelente')
  })

  it('clasifica como Inaceptable por debajo de 0.6', () => {
    expect(interpretarAlfa(0.59).texto).toBe('Inaceptable')
    expect(interpretarAlfa(0).texto).toBe('Inaceptable')
  })

  it('respeta los límites exactos de cada rango', () => {
    expect(interpretarAlfa(0.8).texto).toBe('Bueno')
    expect(interpretarAlfa(0.79).texto).toBe('Aceptable')
    expect(interpretarAlfa(0.7).texto).toBe('Aceptable')
    expect(interpretarAlfa(0.69).texto).toBe('Cuestionable')
  })
})

describe('interpretarNps', () => {
  it('clasifica como Crítico cuando el score es negativo', () => {
    expect(interpretarNps(-10).texto).toBe('Crítico')
  })

  it('clasifica como Excelente desde 70', () => {
    expect(interpretarNps(70).texto).toBe('Excelente')
  })
})

describe('normalizarAlfas', () => {
  it('convierte la forma cruda del back a la forma normalizada del componente', () => {
    const entrada: ComparativaAlfa[] = [
      {
        nombre_constructo: 'Empatía',
        promedio_alfa_constructo: 0.85,
        detalle_procesos: [{ nombre_proceso: 'Enfermería', alfa: 0.87 }],
        preguntas: [
          {
            pregunta: '¿Comprendes los problemas?',
            promedio_alfa_pregunta: 0.82,
            detalle_procesos: [{ nombre_proceso: 'Enfermería', alfa: 0.84 }],
          },
        ],
      },
    ]

    const resultado = normalizarAlfas(entrada)

    expect(resultado).toEqual([
      {
        nombreConstructo: 'Empatía',
        valorGeneral: 0.85,
        detalleProcesos: [{ nombre_proceso: 'Enfermería', valor: 0.87 }],
        preguntas: [
          {
            texto: '¿Comprendes los problemas?',
            valorGeneral: 0.82,
            detalleProcesos: [{ nombre_proceso: 'Enfermería', valor: 0.84 }],
          },
        ],
      },
    ])
  })

  it('devuelve un array vacío si no hay constructos', () => {
    expect(normalizarAlfas([])).toEqual([])
  })
})

describe('normalizarPromedios', () => {
  it('convierte la forma cruda del back a la forma normalizada del componente', () => {
    const entrada: ComparativaPromedio[] = [
      {
        nombre_constructo: 'Liderazgo',
        promedio_general_constructo: 4.1,
        detalle_procesos: [{ nombre_proceso: 'Psicología', promedio: 4.1 }],
        preguntas: [],
      },
    ]

    const resultado = normalizarPromedios(entrada)
    expect(resultado[0].nombreConstructo).toBe('Liderazgo')
    expect(resultado[0].valorGeneral).toBe(4.1)
  })
})