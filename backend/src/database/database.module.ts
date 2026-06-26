import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticaSchema } from '../estadisticas/schemas/estadisticas.schema';
import { EstadisticasRepository } from '../estadisticas/estadisticas.repository';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Estadistica', schema: EstadisticaSchema }])
  ],
  providers: [
    EstadisticasRepository
  ],
  exports: [
    EstadisticasRepository
  ]
})
export class DatabaseModule {}