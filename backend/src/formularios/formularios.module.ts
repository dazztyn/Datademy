
import { Module } from '@nestjs/common';
import { FormulariosController } from './formularios.controller';
import { FormulariosOrquestadorService } from './Orquestador/formularios-orquestador.service';
import { GoogleModule } from 'src/google/google.module';
import { ProcesosService } from './services/procesos.service';
import { PlantillasService } from './services/plantillas.service';
import { ConfiguracionesService } from './services/configuraciones.service';

@Module({
  imports: [
    GoogleModule
  ],
  controllers: [FormulariosController],
  providers: [
    ProcesosService,
    PlantillasService,
    ConfiguracionesService,
    FormulariosOrquestadorService
  ],
  exports: [ProcesosService, PlantillasService, ConfiguracionesService],
})
export class FormulariosModule {}