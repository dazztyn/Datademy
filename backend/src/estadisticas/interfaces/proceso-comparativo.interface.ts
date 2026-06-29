import { MetricaConstructo } from "./metrica-constructo.interface";

export interface ProcesoComparativa {
  id_proceso: string;
  nombre_proceso: string;
  anio: number;
  metricas: {
    promedio_satisfaccion_general: number;
    promedios_por_pagina: MetricaConstructo[];
  };
}