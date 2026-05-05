
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormulariosService } from './formularios.service';
import { FormulariosController } from './formularios.controller';
import { Proceso, ProcesoSchema } from './schemas/proceso.schema';
import { EstudianteEstrategia } from './estrategias/estudiante.estrategia';
import { SocioEstrategia } from './estrategias/socio.estrategia';
import { FormulariosOrquestadorService } from './Orquestador/formularios-orquestador.service';
import { GoogleModule } from 'src/google/google.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proceso.name, schema: ProcesoSchema }
    ]),
    GoogleModule
  ],
  controllers: [FormulariosController],
  providers: [
    FormulariosService,
    EstudianteEstrategia,
    SocioEstrategia,
    FormulariosOrquestadorService
  ],
})
export class FormulariosModule {}