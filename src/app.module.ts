import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { FormulariosModule } from './formularios/formularios.module';
import { GoogleModule } from './google/google.module';

@Module({
  imports: [UsuariosModule, FormulariosModule, GoogleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
