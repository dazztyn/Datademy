// src/formularios/schemas/plantilla.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlantillaDocument = Plantilla & Document;

@Schema({ timestamps: true })
export class Plantilla 
{  

  @Prop({ required: true })
  usuario_id!: string;
  
  @Prop({ required: true })
  idPlantilla!: string;

  @Prop({ required: true })
  nombrePlantilla!: string;

}

export const PlantillaSchema = SchemaFactory.createForClass(Plantilla);