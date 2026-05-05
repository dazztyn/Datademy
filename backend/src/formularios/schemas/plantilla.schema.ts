// src/formularios/schemas/plantilla.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlantillaDocument = Plantilla & Document;

@Schema({ timestamps: true })
export class Plantilla {
  @Prop({ required: true })
  id_google_drive!: string;

  @Prop({ required: true })
  nombre!: string;
}

export const PlantillaSchema = SchemaFactory.createForClass(Plantilla);