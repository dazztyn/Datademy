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
import { ServeStaticModule } from '@nestjs/serve-static';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { join } from 'path';

const getRedisConfig = () => {
  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password,
      tls: {
        rejectUnauthorized: false,
      },
    };
  }
  
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
};

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
      redis: getRedisConfig(),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisConf = getRedisConfig();
        
        const storeConfig = {
          socket: {
            host: redisConf.host,
            port: redisConf.port,
            tls: true,
            rejectUnauthorized: false, 
          },
          password: redisConf.password,
          ttl: 86400000,
        };

        return {
          store: await redisStore(storeConfig),
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'), 
      exclude: ['/api/{*splat}'],
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
