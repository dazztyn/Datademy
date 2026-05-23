import { Module } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';

@Module({
  providers: [EstadisticasService]
})
export class EstadisticasModule {}
