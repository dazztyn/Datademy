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

      scope: 
      [
        'email', 
        'profile', 
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
      ],
    });
  }
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

    done(null, usuarioDeGoogle);
  }
}

