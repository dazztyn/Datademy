// src/estadisticas/schemas/estadistica.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EstadisticaDocument = Estadistica & Document;

// ==========================================
// Sub-Esquema 1: Datos Personales 
// ==========================================
@Schema({ _id: false }) // _id: false evita que Mongo genere un ID por cada subdocumento
export class DatosRespondente {
  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: true })
  carrera!: string;

  // Un mapa flexible por si a futuro piden añadir "correo", "rut", etc., sin romper nada
  @Prop({ type: Map, of: String })
  metadatos_adicionales?: Map<string, string>;
}
const DatosRespondenteSchema = SchemaFactory.createForClass(DatosRespondente);

// ==========================================
// Sub-Esquema 2: La Pregunta Individual
// ==========================================
@Schema({ _id: false })
export class RespuestaPregunta {
  @Prop({ required: true })
  pregunta!: string;

  @Prop({ required: true })
  respuesta_texto!: string;

  @Prop({ required: true })
  valor_numerico!: number;
}
const RespuestaPreguntaSchema = SchemaFactory.createForClass(RespuestaPregunta);

// ==========================================
// Sub-Esquema 3: La Página / Constructo (Páginas 2+)
// ==========================================
@Schema({ _id: false })
export class PaginaConstructo {
  @Prop({ required: true })
  numero_pagina!: number; // Ej: Página 2 (Constructo 1), Página 3 (Constructo 2)...

  @Prop({ required: false })
  nombre_constructo?: string; // Opcional, por si Google Forms nos da el título de la sección

  // Un arreglo dinámico de preguntas dentro de esta página específica
  @Prop({ type: [RespuestaPreguntaSchema], required: true })
  preguestas_pagina!: RespuestaPregunta[];
}
const PaginaConstructoSchema = SchemaFactory.createForClass(PaginaConstructo);

// ==========================================
// Esquema Principal: El Documento de la Encuesta
// ==========================================
@Schema({ timestamps: true })
export class Estadistica {
  
  @Prop({ required: true, unique: true })
  id_respuesta_google!: string;

  @Prop({ required: true })
  proceso_id!: string;

  @Prop({ required: true })
  usuario_id!: string;

  @Prop({ required: true, enum: ['socios', 'estudiantes'] })
  tipo_formulario!: string;

  // Conexión directa: La información del alumno que respondió
  @Prop({ type: DatosRespondenteSchema, required: true })
  datos_respondente!: DatosRespondente;

  // Arreglo elástico de constructos agrupados por página
  @Prop({ type: [PaginaConstructoSchema], required: true })
  constructos_paginas!: PaginaConstructo[];
}

export const EstadisticaSchema = SchemaFactory.createForClass(Estadistica);