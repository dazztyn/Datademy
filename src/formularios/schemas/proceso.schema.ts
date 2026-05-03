// src/formularios/schemas/proceso.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Esta línea ayuda a que TypeScript entienda la estructura al autocompletar el código
export type ProcesoDocument = Proceso & Document;

// El decorador @Schema le dice a NestJS que esta clase será una "colección" en MongoDB.
// timestamps: true agregará automáticamente la fecha de creación y actualización.
@Schema({ timestamps: true })
export class Proceso {
  
  // @Prop define una propiedad. required: true significa que este dato es obligatorio.
  @Prop({ required: true })
  nombre_proceso!: string;

  @Prop({ required: true })
  anio!: number;

  // type: Object permite guardar una estructura con varios datos dentro (los IDs de Google)
  @Prop({ type: Object })
  formulario_estudiantes!: {
    id_google_form: string;
    id_carpeta_drive: string;
  };

  @Prop({ type: Object })
  formulario_socios!: {
    id_google_form: string;
    id_carpeta_drive: string;
  };
}

// Finalmente, compilamos la clase en un esquema que MongoDB pueda leer
export const ProcesoSchema = SchemaFactory.createForClass(Proceso);