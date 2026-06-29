import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfiguracionReportesDocument = ConfiguracionReportes & Document;

@Schema({ timestamps: true })
export class ConfiguracionReportes {
  @Prop({ required: true })
  usuario_id!: string;

  @Prop({ required: false })
  id_carpeta_destino_informes?: string;

  @Prop({ required: false })
  id_plantilla_informe?: string;
}

export const ConfiguracionReportesSchema = SchemaFactory.createForClass(ConfiguracionReportes);