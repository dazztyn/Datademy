import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate 
{
  canActivate(context: ExecutionContext): boolean 
  {
    const request = context.switchToHttp().getRequest();
    const usuario = request.user; 

    if (!usuario || usuario.rol !== 'admin') {
      throw new UnauthorizedException('Acceso denegado. Se requieren permisos de Administrador.');
    }
    return true;
  }
}