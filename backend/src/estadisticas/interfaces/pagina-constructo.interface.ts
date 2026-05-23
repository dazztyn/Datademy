
export interface RespuestaPregunta 
{
  pregunta: string;
  respuesta_texto: string;
  valor_numerico: number;
}

export interface PaginaConstructo 
{
  numero_pagina: number;
  nombre_constructo?: string; 
  preguestas_pagina: RespuestaPregunta[];
}