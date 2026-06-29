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

export interface ConteoDemograficoRaw {
  _id: string; 
  cantidad: number;
}

export interface NpsMongoRaw {
  _id: null;
  promotores: number;
  pasivos: number;
  detractores: number;
  totalValidos: number;
}