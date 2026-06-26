
import { Module } from '@nestjs/common';
import { FormulariosService } from './formularios.service';
import { FormulariosController } from './formularios.controller';
import { FormulariosOrquestadorService } from './Orquestador/formularios-orquestador.service';
import { GoogleModule } from 'src/google/google.module';

@Module({
  imports: [
    GoogleModule
  ],
  controllers: [FormulariosController],
  providers: [
    FormulariosService,
    FormulariosOrquestadorService
  ],
  exports: [FormulariosService],
})
export class FormulariosModule {}