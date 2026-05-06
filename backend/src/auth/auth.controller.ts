import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //El botón del frontend apunta aquí. Esto redirige a la pantalla de Google.
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async inicioSesionGoogle() {}

  // A donde Google nos devuelve después de que el usuario acepta los permisos
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const resultadoLogin = await this.authService.validarUsuarioGoogle(req.user);

    const urlFrontend = 'http://localhost:5173/login';

    const jwt = resultadoLogin.tokens.backendJwt;
    const gToken = resultadoLogin.tokens.googleAccessToken;
    
    return res.redirect(`${urlFrontend}?token=${jwt}&gToken=${gToken}`);
  }
}