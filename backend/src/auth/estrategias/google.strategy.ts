import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') 
{
  constructor(private configService: ConfigService) 
  {
    super
    ({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,

      // permisos para acceder a la info para el picker
      scope: 
      [
        'email', 
        'profile', 
        'https://www.googleapis.com/auth/drive.readonly' // Permiso para el Picker
      ],
    });
  }

  // Esta función se ejecuta automáticamente cuando Google nos devuelve al usuario
  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> 
  {
    const { name, emails, photos, id } = profile;
    
    const usuarioDeGoogle = {
      googleId: id,
      correo: emails[0].value,
      nombre: `${name.givenName} ${name.familyName}`,
      avatarUrl: photos[0].value,
      accessToken, 
    };

    // fin de peticiones a google y retorno a la app
    done(null, usuarioDeGoogle);
  }
}

