import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller';
import { Estadistica, EstadisticaSchema } from './schemas/estadisticas.schema';
import { GoogleModule } from '../google/google.module';
import { EstadisticasWebhooksService } from './services/estadisticas-webhooks.service';
import { EstadisticasConsultasService } from './services/estadisticas-consultas.service';
import { EstadisticasSeederService } from './services/estadisticas-seeder.service';
import { FormulariosModule } from 'src/formularios/formularios.module';
import { EstadisticasMathService } from './services/estadisticas-math.service';
import { EstadisticasParserService } from './services/estadisticas-parser.service';
import { EstadisticasFormatterService } from './services/estadisticas-formatter.service';
import { EstadisticasAnaliticasService } from './services/estadisticas-analiticas.service';
import { EstadisticasRepository } from './estadisticas.repository';
import { DemograficosCalculator } from './calculadoras/demograficos.calculator';
import { RankingCalculator } from './calculadoras/ranking.calculator';
import { NpsCalculator } from './calculadoras/nps.calculator';
import { SatisfaccionCalculator } from './calculadoras/satisfaccion.calculator';
import { EstadisticasWebhooksController } from './estadisticas-webhooks.controller';

@Module({
  imports: [
    GoogleModule,
    FormulariosModule
  ],
  controllers: [
    EstadisticasController,
    EstadisticasWebhooksController
  ],
  providers: [
    EstadisticasWebhooksService,
    EstadisticasConsultasService,
    EstadisticasSeederService,
    EstadisticasMathService,
    EstadisticasParserService,
    EstadisticasFormatterService,
    EstadisticasAnaliticasService,
    NpsCalculator,
    RankingCalculator,
    DemograficosCalculator,
    SatisfaccionCalculator
  ],
  exports: [
    EstadisticasWebhooksService,
    EstadisticasConsultasService,
    EstadisticasFormatterService,
    EstadisticasAnaliticasService
  ]
})
export class EstadisticasModule {}
