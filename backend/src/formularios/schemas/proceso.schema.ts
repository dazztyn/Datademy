
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcesoDocument = Proceso & Document;

@Schema({ timestamps: true })
export class Proceso {
  
  @Prop({ required: true })
  nombre_proceso!: string;

  @Prop({ required: true })
  anio!: number;

  @Prop({ type: Object })
  formulario_estudiantes?: {
    id_google_form: string;
    id_carpeta_drive: string;
    nombre_formulario: string;
    url_edicion?: string; 
    url_respuesta?: string;
  };

  @Prop({ type: Object })
  formulario_socios?: {
    id_google_form: string;
    id_carpeta_drive: string;
    nombre_formulario: string;
    url_edicion?: string;
    url_respuesta?: string;
  };
}

export const ProcesoSchema = SchemaFactory.createForClass(Proceso);