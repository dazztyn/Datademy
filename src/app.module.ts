import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { FormulariosModule } from './formularios/formularios.module';
import { GoogleModule } from './google/google.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: 
  [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    UsuariosModule, 
    FormulariosModule, 
    GoogleModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
