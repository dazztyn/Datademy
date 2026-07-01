import { Injectable } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly repositorio: UsuariosRepository
  ) {}

  async buscarPorCorreo(correo: string) {
    return await this.repositorio.buscarPorCorreo(correo);
  }

  async vincularCuentaGoogle(id: string, datos: { googleId: string, avatarUrl: string, nombre: string }) {
    return await this.repositorio.actualizarCuentaGoogle(id, datos);
  }

  async crearUsuarioManual(datos: { nombre: string, correo: string, rol: string }) {
    try {

      const usuarioGuardado = await this.repositorio.crearUsuario({
        nombre: datos.nombre,
        correo: datos.correo,
        rol: datos.rol
      });

      return {
        mensaje: 'Usuario registrado exitosamente en la lista de invitados',
        datos: usuarioGuardado
      };
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw new Error('No se pudo crear el usuario. ¿Quizás el correo ya existe en la base de datos?');
    }
  }
}