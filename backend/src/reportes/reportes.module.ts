import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { ConfiguracionReportes, ConfiguracionReportesSchema } from './schemas/configuracion-reportes.schema';
import { ReportesDocsService } from './reportes-docs.service';
import { ReportesDriveService } from './reportes-drive.service';
import { ReportesConfigService } from './reportes-config.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConfiguracionReportes.name, schema: ConfiguracionReportesSchema }]),
    BullModule.registerQueue({
      name: 'reportes', 
    }),
  ],
  providers: [
    ReportesService,
    ReportesConfigService,
    ReportesDriveService,
    ReportesDocsService
  ],
  controllers: [ReportesController]
})
export class ReportesModule {}