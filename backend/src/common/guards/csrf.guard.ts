import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      
      if (!request.cookies || !request.cookies['backendJwt']) {
        return true;
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const origin = request.headers.origin;
      const referer = request.headers.referer;

      if (!origin && !referer) {
        throw new ForbiddenException('Petición rechazada: Falta cabecera de origen (Protección Anti-CSRF).');
      }
      const requestOrigin = origin || (referer ? new URL(referer).origin : '');
      if (requestOrigin && !requestOrigin.startsWith(frontendUrl)) {
        throw new ForbiddenException('Petición cruzada rechazada: Origen no autorizado (Ataque CSRF bloqueado).');
      }
    }

    return true;
  }
}