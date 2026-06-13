import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
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

      scope: 
      [
        'email', 
        'profile', 
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
      ],
    });
  }
  async validate(accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any> 
  {
    const { name, emails, photos, id } = profile;
    
    const usuarioDeGoogle = {
      googleId: id,
      correo: emails?.[0]?.value || 'sin-correo@ucn.cl',
      nombre: name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : 'Usuario Sin Nombre',
      avatarUrl: photos?.[0]?.value || '',
      accessToken, 
    };

    done(null, usuarioDeGoogle);
  }
}

