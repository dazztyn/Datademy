import type { ComparativaAlfa, ComparativaPromedio } from '../services/estadisticos_service'

export const COLORES_PROCESO = ['#5fb7bb', '#0d438b', '#7f458f', '#f59e0b', '#22c55e', '#ef4444']

export function interpretarAlfa(alfa: number): { texto: string; color: string } {
  if (alfa >= 0.9) return { texto: 'Excelente', color: '#22c55e' }
  if (alfa >= 0.8) return { texto: 'Bueno', color: '#84cc16' }
  if (alfa >= 0.7) return { texto: 'Aceptable', color: '#eab308' }
  if (alfa >= 0.6) return { texto: 'Cuestionable', color: '#f97316' }
  return { texto: 'Inaceptable', color: '#ef4444' }
}

export function interpretarNps(score: number): { texto: string; color: string } {
  if (score >= 70) return { texto: 'Excelente', color: '#22c55e' }
  if (score >= 30) return { texto: 'Bueno', color: '#84cc16' }
  if (score >= 0) return { texto: 'Aceptable', color: '#eab308' }
  return { texto: 'Crítico', color: '#ef4444' }
}

export interface DetalleProcesoNormalizado {
  nombre_proceso: string
  valor: number
}
export interface PreguntaNormalizada {
  texto: string
  valorGeneral: number
  detalleProcesos: DetalleProcesoNormalizado[]
}
export interface ItemComparativoNormalizado {
  nombreConstructo: string
  valorGeneral: number
  detalleProcesos: DetalleProcesoNormalizado[]
  preguntas: PreguntaNormalizada[]
}

export function normalizarAlfas(items: ComparativaAlfa[]): ItemComparativoNormalizado[] {
  return items.map(item => ({
    nombreConstructo: item.nombre_constructo,
    valorGeneral: item.promedio_alfa_constructo,
    detalleProcesos: item.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.alfa })),
    preguntas: item.preguntas.map(p => ({
      texto: p.pregunta,
      valorGeneral: p.promedio_alfa_pregunta,
      detalleProcesos: p.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.alfa })),
    })),
  }))
}

export function normalizarPromedios(items: ComparativaPromedio[]): ItemComparativoNormalizado[] {
  return items.map(item => ({
    nombreConstructo: item.nombre_constructo,
    valorGeneral: item.promedio_general_constructo,
    detalleProcesos: item.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.promedio })),
    preguntas: item.preguntas.map(p => ({
      texto: p.pregunta,
      valorGeneral: p.promedio_general_pregunta,
      detalleProcesos: p.detalle_procesos.map(d => ({ nombre_proceso: d.nombre_proceso, valor: d.promedio })),
    })),
  }))
}
