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
import { EstadisticasRepository } from './estadisticas.repository';
import { DemograficosCalculator } from './calculadoras/demograficos.calculator';
import { RankingCalculator } from './calculadoras/ranking.calculator';
import { NpsCalculator } from './calculadoras/nps.calculator';
import { SatisfaccionCalculator } from './calculadoras/satisfaccion.calculator';

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
    EstadisticasAnaliticasService,
    EstadisticasRepository,
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
