import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller';
import { Estadistica, EstadisticaSchema } from './schemas/estadisticas.schema';
import { GoogleModule } from '../google/google.module';
import { EstadisticasWebhooksService } from './estadisticas-webhooks.service';
import { EstadisticasConsultasService } from './estadisticas-consultas.service';
import { EstadisticasSeederService } from './estadisticas-seeder.service';
import { FormulariosModule } from 'src/formularios/formularios.module';
import { EstadisticasMathService } from './estadisticas-math.service';
import { EstadisticasParserService } from './estadisticas-parser.service';
import { EstadisticasFormatterService } from './estadisticas-formatter.service';
import { EstadisticasAnaliticasService } from './estadisticas-analiticas.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Estadistica.name, schema: EstadisticaSchema }]),
    GoogleModule,
    FormulariosModule
  ],
  controllers: [EstadisticasController],
  providers: [
    EstadisticasWebhooksService,
    EstadisticasConsultasService,
    EstadisticasSeederService,
    EstadisticasMathService,
    EstadisticasParserService,
    EstadisticasFormatterService,
    EstadisticasAnaliticasService
  ],
  exports: [
    EstadisticasWebhooksService,
    EstadisticasConsultasService,
    EstadisticasFormatterService,
    EstadisticasAnaliticasService
  ]
})
export class EstadisticasModule {}
