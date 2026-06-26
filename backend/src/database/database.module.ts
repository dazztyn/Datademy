import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticaSchema } from '../estadisticas/schemas/estadisticas.schema';
import { EstadisticasRepository } from '../estadisticas/estadisticas.repository';
import { ProcesoSchema } from '../formularios/schemas/proceso.schema';
import { FormulariosRepository } from '../formularios/formularios.repository';
import { PlantillaSchema } from '../formularios/schemas/plantilla.schema';
import { ConfiguracionSchema } from '../formularios/schemas/configuracion.schema';


@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Estadistica', schema: EstadisticaSchema },
      { name: 'Proceso', schema: ProcesoSchema },
      { name: 'Plantilla', schema: PlantillaSchema },
      { name: 'Configuracion', schema: ConfiguracionSchema }
    ]
    )
  ],
  providers: [
    EstadisticasRepository,
    FormulariosRepository
  ],
  exports: [
    EstadisticasRepository,
    FormulariosRepository
  ]
})
export class DatabaseModule {}