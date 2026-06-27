import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('usuarios')
@UseGuards(AuthGuard('jwt'))
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('registrar')
  async registrarInvitado(
    @Body() body: { nombre: string; correo: string; rol: string }
  ) {
    return await this.usuariosService.crearUsuarioManual(body);
  }

  @Get('buscar')
  async buscarUsuario(@Body() body: { correo: string }) {
    return await this.usuariosService.buscarPorCorreo(body.correo);
  }


}