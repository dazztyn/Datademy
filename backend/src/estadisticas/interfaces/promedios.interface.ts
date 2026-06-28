export interface PromedioMongoRaw 
{
  _id: number; 
  promedio_bruto: number;
}

export interface PromedioPagina 
{
  numero_pagina: number;
  nombre_constructo: string;
  promedio_constructo: number;
}