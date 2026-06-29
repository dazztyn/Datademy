import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { ConfiguracionReportes, ConfiguracionReportesSchema } from './schemas/configuracion-reportes.schema';
import { ReportesDocsService } from './services/reportes-docs.service';
import { ReportesDriveService } from './services/reportes-drive.service';
import { ReportesConfigService } from './services/reportes-config.service';
import { BullModule } from '@nestjs/bull';
import { ReportesProcessor } from './reportes.processor';
import { FormulariosModule } from 'src/formularios/formularios.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConfiguracionReportes.name, schema: ConfiguracionReportesSchema }]),
    BullModule.registerQueue({
      name: 'reportes', 
    })
  ],
  providers: [
    ReportesService,
    ReportesConfigService,
    ReportesDriveService,
    ReportesDocsService,
    ReportesProcessor
  ],
  controllers: [ReportesController]
})
export class ReportesModule {}