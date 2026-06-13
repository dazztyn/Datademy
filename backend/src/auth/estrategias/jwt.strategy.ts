// src/auth/estrategias/jwt.strategy.ts
import { ExtractJwt, Strategy  } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express'; 
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['backendJwt']; 
          }
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), 
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    return { 
      userId: payload.sub, 
      correo: payload.correo, 
      rol: payload.rol 
    };
  }
}