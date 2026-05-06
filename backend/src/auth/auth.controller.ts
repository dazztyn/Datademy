import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // RUTA 1: El botón del frontend apunta aquí. Esto redirige a la pantalla de Google.
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async inicioSesionGoogle() {
    // NestJS y la estrategia de Passport manejan la redirección automáticamente
  }

  // RUTA 2: A donde Google nos devuelve después de que el usuario acepta los permisos
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const resultadoLogin = await this.authService.validarUsuarioGoogle(req.user);

    // Como aún no tenemos el frontend conectado, vamos a devolver un JSON visual
    // En el futuro, cambiaremos esto para que redirija a tu React entregando los tokens
    return res.json({
      mensaje: '¡Login Exitoso!',
      datos: resultadoLogin
    });
  }
}