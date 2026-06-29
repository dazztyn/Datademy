import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';


async function bootstrap() 
{
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(helmet());

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.use(cookieParser());
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true, 
  }));

  app.enableCors({
    credentials: true
  })
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
