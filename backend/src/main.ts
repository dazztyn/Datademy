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

  app.use(helmet(
    {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
        
        frameSrc: [
          "'self'", 
          "https://apis.google.com", 
          "https://accounts.google.com", 
          "https://docs.google.com", 
          "https://drive.google.com"
        ],
        
        imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://ssl.gstatic.com"],
        
        connectSrc: ["'self'", "https://apis.google.com", "https://accounts.google.com", "https://www.googleapis.com"],
        
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      },
      crossOriginEmbedderPolicy: false,
    } as any
  ));

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
