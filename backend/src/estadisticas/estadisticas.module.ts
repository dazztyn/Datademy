import { Module } from '@nestjs/common';
import { EstadisticasController } from './estadisticas.controller';
import { GoogleModule } from '../google/google.module';
import { EstadisticasWebhooksService } from './services/estadisticas-webhooks.service';
import { EstadisticasConsultasService } from './services/estadisticas-consultas.service';
import { FormulariosModule } from 'src/formularios/formularios.module';
import { EstadisticasMathService } from './services/estadisticas-math.service';
import { EstadisticasParserService } from './services/estadisticas-parser.service';
import { EstadisticasFormatterService } from './services/estadisticas-formatter.service';
import { EstadisticasAnaliticasService } from './services/estadisticas-analiticas.service';
import { DemograficosCalculator } from './calculadoras/demograficos.calculator';
import { RankingCalculator } from './calculadoras/ranking.calculator';
import { NpsCalculator } from './calculadoras/nps.calculator';
import { SatisfaccionCalculator } from './calculadoras/satisfaccion.calculator';
import { EstadisticasWebhooksController } from './estadisticas-webhooks.controller';
import { EstadisticasEventosLimpiezaService } from './services/estadisticas-eventos-limpieza.service';
import { EstadisticasExportacionService } from './services/estadisticas-exportacion.service';
import { EstadisticasComparativasService } from './services/estadisticas-comparativas.service';

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
    EstadisticasMathService,
    EstadisticasParserService,
    EstadisticasFormatterService,
    EstadisticasAnaliticasService,
    EstadisticasEventosLimpiezaService,
    EstadisticasExportacionService,
    EstadisticasComparativasService,
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
