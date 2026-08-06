import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';
import type { RequestConUsuario } from '../auth/interfaces/request-con-usuario.interface';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('usuarios')
  async listarUsuarios() {
    return await this.adminService.obtenerTodosLosUsuarios();
  }

  @Post('usuarios')
  async crearUsuario(@Body() body: { correo: string; nombre: string; rol?: string, activo?: boolean }) {
    return await this.adminService.agregarUsuario(body.correo, body.nombre, body.rol, body.activo);
  }

  @Delete('usuarios/:id')
  async eliminarUsuario(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return await this.adminService.eliminarUsuarioYDatos(id, req.user.userId);
  }
}