import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { ConfiguracionReportes, ConfiguracionReportesSchema } from './schemas/configuracion-reportes.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConfiguracionReportes.name, schema: ConfiguracionReportesSchema }])
  ],
  providers: [ReportesService],
  controllers: [ReportesController]
})
export class ReportesModule {}