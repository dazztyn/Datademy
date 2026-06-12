
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EstadisticaDocument = Estadistica & Document;

@Schema({ _id: false }) 
export class DatosRespondente {
  @Prop({ required: true, default: 'No especificado' })
  nombre!: string;

  @Prop({ required: true, default: 'No especificada' })
  edad!: string;

  @Prop({ required: true, default: 'No especificado' })
  genero!: string;

  @Prop({ required: true, default: 'No especificado' })
  nivel_formativo!: string;

  @Prop({ required: true, default: 'No especificada' })
  sede!: string;

  @Prop({ required: true, default: 'No especificada' })
  carrera!: string;
  
  @Prop({ required: true, default: 'No especificada' })
  organizacion!: string;

  @Prop({ type: Map, of: String })
  metadatos_adicionales?: Map<string, string>;
}

const DatosRespondenteSchema = SchemaFactory.createForClass(DatosRespondente);

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

@Schema({ _id: false })
export class PaginaConstructo {
  @Prop({ required: true })
  numero_pagina!: number; 

  @Prop({ required: false })
  nombre_constructo?: string; 

  @Prop({ type: [RespuestaPreguntaSchema], required: true })
  preguntas_pagina!: RespuestaPregunta[];
}
const PaginaConstructoSchema = SchemaFactory.createForClass(PaginaConstructo);

@Schema({ timestamps: true })
export class Estadistica {
  
  @Prop({ required: true, unique: true })
  id_respuesta_google!: string;

  @Prop({ required: true })
  fecha_respuesta!: Date;

  @Prop({ required: true })
  proceso_id!: string;

  @Prop({ required: true })
  usuario_id!: string;

  @Prop({ required: true, enum: ['socios', 'estudiantes'] })
  tipo_formulario!: string;

  @Prop({ type: DatosRespondenteSchema, required: true })
  datos_respondente!: DatosRespondente;

  @Prop({ type: [PaginaConstructoSchema], required: true })
  constructos_paginas!: PaginaConstructo[];
}

export const EstadisticaSchema = SchemaFactory.createForClass(Estadistica);