import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async inicioSesionGoogle() {}


  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) 
  {
    const resultadoLogin = await this.authService.validarUsuarioGoogle(req.user);

    const urlFrontendBase = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const urlFrontend = `${urlFrontendBase}/login`;

    const jwt = resultadoLogin.tokens.backendJwt;
    const gToken = resultadoLogin.tokens.googleAccessToken;
    
    console.log(jwt);
    return res.redirect(`${urlFrontend}?token=${jwt}&gToken=${gToken}`);
  }
}