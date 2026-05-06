import { Controller, Post, Body, Delete, Get } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // usar en localhost:3000/usuarios/registrar
  @Post('registrar')
  async registrarInvitado(
    @Body() body: { nombre: string; correo: string; rol: string }
  ) {
    return await this.usuariosService.crearUsuarioManual(body);
  }

  // usar en localhost:3000/usuarios/buscar con un body tipo { "correo": " 
  @Get('buscar')
  async buscarUsuario(@Body() body: { correo: string }) {
    return await this.usuariosService.buscarPorCorreo(body.correo);
  }


}