import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuarios.schema';
import { Proceso, ProcesoSchema } from '../formularios/schemas/proceso.schema';
import { Estadistica, EstadisticaSchema } from '../estadisticas/schemas/estadisticas.schema';
import { ConfiguracionReportes, ConfiguracionReportesSchema } from '../reportes/schemas/configuracion-reportes.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Proceso.name, schema: ProcesoSchema },
      { name: Estadistica.name, schema: EstadisticaSchema },
      { name: ConfiguracionReportes.name, schema: ConfiguracionReportesSchema }
    ])
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}