
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormulariosService } from './formularios.service';
import { FormulariosController } from './formularios.controller';
import { Proceso, ProcesoSchema } from './schemas/proceso.schema';
import { FormulariosOrquestadorService } from './Orquestador/formularios-orquestador.service';
import { GoogleModule } from 'src/google/google.module';
import { Plantilla, PlantillaSchema } from './schemas/plantilla.schema';
import { Configuracion, ConfiguracionSchema } from './schemas/configuracion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proceso.name, schema: ProcesoSchema },
      { name: Plantilla.name, schema: PlantillaSchema },
      { name: Configuracion.name, schema: ConfiguracionSchema }
    ]),
    GoogleModule
  ],
  controllers: [FormulariosController],
  providers: [
    FormulariosService,
    FormulariosOrquestadorService
  ],
  exports: [FormulariosService],
})
export class FormulariosModule {}