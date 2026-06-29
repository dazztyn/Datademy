
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfiguracionDocument = Configuracion & Document;

@Schema({ timestamps: true })
export class Configuracion 
{

  @Prop({ required: true })
  usuario_id!: string;

  @Prop({ required: false })
  id_carpeta_destino_formularios?: string;

}

export const ConfiguracionSchema = SchemaFactory.createForClass(Configuracion);