import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UsuariosModule } from './usuarios/usuarios.module';
import { FormulariosModule } from './formularios/formularios.module';
import { GoogleModule } from './google/google.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { ReportesModule } from './reportes/reportes.module';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthController } from './health.controller';
import { CsrfGuard } from './common/guards/csrf.guard';

@Module({
  imports: 
  [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, 
    }]),
    EventEmitterModule.forRoot(),
    UsuariosModule, 
    DatabaseModule,
    FormulariosModule, 
    GoogleModule, 
    AuthModule, 
    EstadisticasModule, 
    ReportesModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.NODE_ENV === 'production' ? {} : undefined,
      },
    }),
  ],
  controllers: 
  [
    HealthController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule{}
