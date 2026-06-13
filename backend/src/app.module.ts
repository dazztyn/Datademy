import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { FormulariosModule } from './formularios/formularios.module';
import { GoogleModule } from './google/google.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { ReportesModule } from './reportes/reportes.module';
import * as express from 'express';

@Module({
  imports: 
  [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    UsuariosModule, 
    FormulariosModule, 
    GoogleModule, 
    AuthModule, 
    EstadisticasModule, 
    ReportesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule 
{
  configure(consumer: MiddlewareConsumer) 
  {
    consumer
      .apply(express.json({ limit: '50mb' }), express.urlencoded({ limit: '50mb', extended: true }))
      .forRoutes('reportes/generar');

    consumer
      .apply(express.json({ limit: '2mb' }), express.urlencoded({ limit: '2mb', extended: true }))
      .exclude('reportes/generar') 
      .forRoutes('*'); 
  }
}
