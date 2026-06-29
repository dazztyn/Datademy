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

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
        "frame-src": [
          "'self'", 
          "https://apis.google.com", 
          "https://accounts.google.com", 
          "https://docs.google.com", 
          "https://drive.google.com"
        ],
        "img-src": ["'self'", "data:", "https://*.googleusercontent.com", "https://ssl.gstatic.com"],
        "connect-src": ["'self'", "https://apis.google.com", "https://accounts.google.com", "https://www.googleapis.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false, 
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

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
