import { MetricaConstructo } from "./metrica-constructo.interface";
import { ResultadoCronbach } from "./resultado-cronbach.interface";

export interface PreguntaDetalle {
  pregunta: string;
  promedio: number;
  total_respuestas: number;
  distribucion_frecuencias: Record<number, number>;
}

export interface DimensionDetalle {
  numero_pagina: number;
  nombre_constructo: string;
  pregunta_mayor_promedio: { pregunta: string; promedio: number } | null;
  pregunta_menor_promedio: { pregunta: string; promedio: number } | null;
  preguntas: PreguntaDetalle[];
}

export interface NpsSatisfaccion {
  score_nps: number;
  distribucion_porcentajes: { promotores_pct: number; pasivos_pct: number; detractores_pct: number; };
  cantidades_reales: { promotores: number; pasivos: number; detractores: number; total: number; };
}

export interface ProcesoComparativa {
  id_proceso: string;
  nombre_proceso: string;
  anio: number;
  metricas: {
    promedio_satisfaccion_general: number;
    promedios_por_pagina: MetricaConstructo[];
    fiabilidad_constructos?: ResultadoCronbach[];
    detalle_por_dimension?: DimensionDetalle[]; 
    nps_satisfaccion?: NpsSatisfaccion | null; 
  };
  variacion_satisfaccion_respecto_anterior?: number | null;
  variaciones_constructos?: VariacionConstructo[];
}

export interface VariacionConstructo {
  nombre_constructo: string;
  promedio_actual: number;
  variacion_respecto_anterior: number | null;
}

export interface DetalleAlfa {
  nombre_proceso: string;
  alfa: number;
}

export interface ConstructoAgrupado {
  nombre_constructo: string;
  alfas_globales: DetalleAlfa[];
  mapa_preguntas: Map<string, DetalleAlfa[]>;
}