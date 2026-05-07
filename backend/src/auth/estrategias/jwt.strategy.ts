// src/auth/estrategias/jwt.strategy.ts
import { ExtractJwt, Strategy  } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      // Extrae el token de la cabecera 'Authorization: Bearer <token>'
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // Esta función se ejecuta si el token es válido.
  // El "payload" es lo que tu compañero guardó en auth.service.ts
  async validate(payload: any) {
    return { 
      userId: payload.sub, // Aquí viene el ID de MongoDB del usuario
      correo: payload.correo, 
      rol: payload.rol 
    };
  }
}