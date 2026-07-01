import { Controller, Get, UseGuards, Req, Res, Post, UnauthorizedException, Body} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { RequestConPerfilGoogle } from './interfaces/request-con-perfil-google.interface';
import type { RequestConUsuario } from './interfaces/request-con-usuario.interface';
import { OAuth2Client } from 'google-auth-library';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async inicioSesionGoogle() {}

  @Get('google-token')
  @UseGuards(AuthGuard('jwt'))
  obtenerTokenGoogle(@Req() req: RequestConUsuario) 
  {
    const gToken = req.cookies['googleAccessToken'];
    
    if (!gToken) {
      return { estado: 'error', mensaje: 'No hay token de Google o ha expirado' };
    }

    return {
      estado: 'exito',
      googleAccessToken: gToken
    };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: RequestConPerfilGoogle, @Res() res: Response) 
  {
    const resultadoLogin = await this.authService.validarUsuarioGoogle(req.user);

    const urlFrontendBase = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    
    const jwt = resultadoLogin.tokens.backendJwt;
    const gToken = resultadoLogin.tokens.googleAccessToken;

    const tiempoVida8Horas = 8 * 60 * 60 * 1000; 

    res.cookie('backendJwt', jwt, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: tiempoVida8Horas,
    });

    res.cookie('googleAccessToken', gToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: tiempoVida8Horas,
    });
    return res.redirect(`${urlFrontendBase}/dashboard`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  verificarSesion(@Req() req: RequestConUsuario) {
    return {
      estado: 'exito',
      usuario: req.user
    };
  }

  @Post('logout')
  cerrarSesionBackend(@Res() res: Response) {
    const opcionesCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    };
    res.clearCookie('backendJwt', opcionesCookie);
    res.clearCookie('googleAccessToken', opcionesCookie);
    
    return res.status(200).json({ estado: 'exito', mensaje: 'Sesión cerrada correctamente' });
  }

  @Post('mobile-login')
  async loginMovil(@Body('idToken') idToken: string) {
    const client = new OAuth2Client();
    try {

      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: [
          this.configService.get<string>('GOOGLE_CLIENT_ID')!,
          this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID')!
        ],
      });
      const payload = ticket.getPayload();

      const perfilGoogle = {
        correo: payload!.email!,
        nombre: payload!.name!,
        googleId: payload!.sub,
        avatarUrl: payload!.picture || '',
        accessToken: 'token_gestionado_en_movil' // El móvil guarda su propio token
      };

      // 3. Pasamos por tu lógica de seguridad (bloqueo de correos, creación de BD, etc)
      const resultado = await this.authService.validarUsuarioGoogle(perfilGoogle);

      return { backendJwt: resultado.tokens.backendJwt };

    } catch (error) {
      console.error('Error verificando token de Google desde el móvil:', error);
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }
  }
}