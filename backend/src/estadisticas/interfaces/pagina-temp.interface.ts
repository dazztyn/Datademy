export interface PaginaTemp 
{
  numero_pagina: number;
  preguntas: { pregunta: string; respuesta_texto: string; valor_numerico: number; orden: number }[];
}