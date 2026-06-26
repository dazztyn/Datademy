import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticaSchema } from '../estadisticas/schemas/estadisticas.schema';
import { EstadisticasRepository } from '../estadisticas/estadisticas.repository';
import { ProcesoSchema } from '../formularios/schemas/proceso.schema';

import { PlantillaSchema } from '../formularios/schemas/plantilla.schema';
import { ConfiguracionSchema } from '../formularios/schemas/configuracion.schema';
import { ProcesosRepository } from '../formularios/repository/procesos.repository';
import { PlantillasRepository } from '../formularios/repository/plantillas.repository';
import { ConfiguracionesRepository } from '../formularios/repository/configuraciones.repository';

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
    ProcesosRepository, 
    PlantillasRepository, 
    ConfiguracionesRepository
  ],
  exports: [
    EstadisticasRepository,
    ProcesosRepository, 
    PlantillasRepository, 
    ConfiguracionesRepository
  ]
})
export class DatabaseModule {}