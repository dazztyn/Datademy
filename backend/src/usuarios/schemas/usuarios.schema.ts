import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

@Schema({ timestamps: true })
export class Usuario {
  
  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: true, unique: true })
  correo!: string;

  @Prop()
  googleId?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ required: true, default: 'profesor' })
  rol!: string;

  @Prop({ default: true })
  activo!: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);