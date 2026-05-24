import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { Estadistica, EstadisticaSchema } from './schemas/estadisticas.schema';
import { GoogleModule } from '../google/google.module';
import { EstadisticasOrquestadorService } from './estadisticas-orquestador.service';
import { FormulariosModule } from 'src/formularios/formularios.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Estadistica.name, schema: EstadisticaSchema }]),
    GoogleModule,
    FormulariosModule
  ],
  controllers: [EstadisticasController],
  providers: [
    EstadisticasService,
    EstadisticasOrquestadorService
  ],
  exports: [
    EstadisticasService,
    EstadisticasOrquestadorService
  ]
})
export class EstadisticasModule {}
