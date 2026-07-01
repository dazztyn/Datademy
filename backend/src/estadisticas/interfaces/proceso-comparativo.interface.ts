import { MetricaConstructo } from "./metrica-constructo.interface";
import { ResultadoCronbach } from "./resultado-cronbach.interface";

export interface ProcesoComparativa {
  id_proceso: string;
  nombre_proceso: string;
  anio: number;
  metricas: {
    promedio_satisfaccion_general: number;
    promedios_por_pagina: MetricaConstructo[];
    fiabilidad_constructos?: ResultadoCronbach[];
  };
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