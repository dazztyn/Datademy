// src/formularios/formularios.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormulariosService } from './formularios.service';
import { FormulariosController } from './formularios.controller';
// 1. Importamos el esquema que acabamos de crear
import { Proceso, ProcesoSchema } from './schemas/proceso.schema';

@Module({
  imports: [
    // 2. Registramos el esquema en este módulo para poder usarlo en la base de datos
    MongooseModule.forFeature([
      { name: Proceso.name, schema: ProcesoSchema }
    ])
  ],
  controllers: [FormulariosController],
  providers: [FormulariosService],
})
export class FormulariosModule {}