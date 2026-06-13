export interface ResultadoCronbach 
{
  numero_pagina: number;
  nombre_constructo: string;
  alfa_cronbach_global: number;
  alfa_si_se_elimina_pregunta: Record<string, number>;
}