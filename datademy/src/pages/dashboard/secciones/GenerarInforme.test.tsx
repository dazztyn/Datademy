import { describe, it, expect } from 'vitest'
import { mapearExtremosPorConstructo, wrapTextParaEtiqueta } from './GenerarInforme'

describe('mapearExtremosPorConstructo', () => {
  it('arma el párrafo de diferencia cuando el menor promedio es <= 2.9', () => {
    const resultado = mapearExtremosPorConstructo([
      {
        numero_pagina: 2,
        preguntas: [
          { pregunta: 'Domina los temas', promedio: 3.5 },
          { pregunta: 'Da retroalimentación a tiempo', promedio: 2.1 },
        ],
      },
    ])

    expect(resultado['ParrafoSec_1']).toContain('Da retroalimentación a tiempo')
    expect(resultado['ParrafoSec_1']).toContain('2.1')
    expect(resultado['MayorNombre_1']).toBe('Domina los temas')
    expect(resultado['MayorPromedio_1']).toBe('3.5')
  })

  it('usa el texto de satisfacción cuando el menor promedio es > 2.9', () => {
    const resultado = mapearExtremosPorConstructo([
      {
        numero_pagina: 2,
        preguntas: [
          { pregunta: 'A', promedio: 3.5 },
          { pregunta: 'B', promedio: 3.0 },
        ],
      },
    ])

    expect(resultado['ParrafoSec_1']).toBe('Esta dimensión nos ha otorgado resultados satisfactorios.')
  })

  it('respeta el límite exacto de 2.9 (caso borde)', () => {
    const resultado = mapearExtremosPorConstructo([
      { numero_pagina: 2, preguntas: [{ pregunta: 'A', promedio: 2.9 }] },
    ])
    expect(resultado['ParrafoSec_1']).toContain('a diferencia de')
  })

  it('deja los campos vacíos si el constructo no tiene preguntas', () => {
    const resultado = mapearExtremosPorConstructo([{ numero_pagina: 2, preguntas: [] }])
    expect(resultado['MayorNombre_1']).toBe('')
    expect(resultado['ParrafoSec_1']).toBe('')
  })

  it('aplica el sufijo del prefijo para socios', () => {
    const resultado = mapearExtremosPorConstructo(
      [{ numero_pagina: 2, preguntas: [{ pregunta: 'A', promedio: 2.0 }] }],
      'S'
    )
    expect(resultado).toHaveProperty('ParrafoSecS_1')
    expect(resultado).not.toHaveProperty('ParrafoSec_1')
  })

  it('no revienta si promedio viene null (evita el bug de "null <= 2.9")', () => {
    const resultado = mapearExtremosPorConstructo([
      { numero_pagina: 2, preguntas: [{ pregunta: 'A', promedio: null }] },
    ])
    expect(resultado['ParrafoSec_1']).toBe('')
  })
})

describe('wrapTextParaEtiqueta', () => {
  it('no envuelve si el texto entra en una sola línea', () => {
    expect(wrapTextParaEtiqueta('Texto corto', 50)).toEqual(['Texto corto'])
  })

  it('envuelve en varias líneas respetando el límite de caracteres', () => {
    const resultado = wrapTextParaEtiqueta('Esta es una pregunta bastante larga para una sola línea', 20)
    expect(resultado.length).toBeGreaterThan(1)
    resultado.forEach(linea => expect(linea.length).toBeLessThanOrEqual(20 + 15)) // margen por palabras largas
  })

  it('no corta palabras a la mitad', () => {
    const resultado = wrapTextParaEtiqueta('palabra1 palabra2 palabra3', 10)
    resultado.forEach(linea => {
      expect(linea).not.toMatch(/\s$/) // ninguna línea termina en espacio raro
    })
  })
})