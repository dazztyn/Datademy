import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EstadisticaSchema } from '../estadisticas/schemas/estadisticas.schema';
import { ProcesoSchema } from '../formularios/schemas/proceso.schema';
import { UsuarioSchema } from '../usuarios/schemas/usuarios.schema';
import { ConfiguracionReportesSchema } from '../reportes/schemas/configuracion-reportes.schema';
import { PlantillaSchema } from '../formularios/schemas/plantilla.schema';
import { ConfiguracionSchema } from '../formularios/schemas/configuracion.schema';

import { EstadisticasRepository } from '../estadisticas/estadisticas.repository';
import { ProcesosRepository } from '../formularios/repository/procesos.repository';
import { PlantillasRepository } from '../formularios/repository/plantillas.repository';
import { ConfiguracionesRepository } from '../formularios/repository/configuraciones.repository';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import { ReportesRepository } from '../reportes/reportes.repository';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Estadistica', schema: EstadisticaSchema },
      { name: 'Proceso', schema: ProcesoSchema },
      { name: 'Plantilla', schema: PlantillaSchema },
      { name: 'Configuracion', schema: ConfiguracionSchema },
      { name: 'Usuario', schema: UsuarioSchema },
      { name: 'ConfiguracionReportes', schema: ConfiguracionReportesSchema }
    ]
    )
  ],
  providers: [
    EstadisticasRepository,
    ProcesosRepository, 
    PlantillasRepository, 
    ConfiguracionesRepository,
    UsuariosRepository, 
    ReportesRepository
  ],
  exports: [
    EstadisticasRepository,
    ProcesosRepository, 
    PlantillasRepository, 
    ConfiguracionesRepository,
    UsuariosRepository, 
    ReportesRepository
  ]
})
export class DatabaseModule {}