import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';

@Module({
  providers: [ReportesService],
  controllers: [ReportesController]
})
export class ReportesModule {}
