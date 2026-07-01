
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { InformeGenerado } from '../interfaces/informe-generado.interface';

export type ProcesoDocument = Proceso & Document;

@Schema({ timestamps: true })
export class Proceso 
{
  
  @Prop({ required: true })
  usuario_id!: string;

  @Prop({ required: true })
  nombre_proceso!: string;

  @Prop({ required: true })
  anio!: number;

  @Prop({ 
    type: String, 
    enum: ['activo', 'borrado_pendiente'], 
    default: 'activo' 
  })
  estado!: 'activo' | 'borrado_pendiente';

  @Prop({ type: Object })
  formulario_estudiantes?: {
    id_google_form: string;
    id_carpeta_drive: string;
    nombre_formulario: string;
    url_edicion?: string; 
    url_respuesta?: string;
    total_esperados?: number;
    nombres_constructos?: string[];
  };

  @Prop({ type: Object })
  formulario_socios?: {
    id_google_form: string;
    id_carpeta_drive: string;
    nombre_formulario: string;
    url_edicion?: string;
    url_respuesta?: string;
    total_esperados?: number;
    nombres_constructos?: string[];
  };
  
  @Prop({
    type: [{
      id_informe_drive: { type: String, required: true },
      nombre_informe: { type: String, required: true },
      url_descarga: { type: String, required: true },
      url_edicion: { type: String, required: false },
      fecha_generacion: { type: Date, default: Date.now }
    }],
    default: []
  })
  informes_generados!: InformeGenerado[];
}

export const ProcesoSchema = SchemaFactory.createForClass(Proceso);