import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { Estadistica, EstadisticaSchema } from './schemas/estadisticas.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Estadistica.name, schema: EstadisticaSchema }])
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService]
})
export class EstadisticasModule {}
