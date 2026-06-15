import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuarios.schema';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModelo: Model<UsuarioDocument>
  ) {}

  async buscarPorCorreo(correo: string) {
    return await this.usuarioModelo.findOne({ correo, activo: true }).exec();
  }

  async vincularCuentaGoogle(id: any, datos: { googleId: string, avatarUrl: string, nombre: string }) {
    return await this.usuarioModelo.findByIdAndUpdate(
      id, 
      { 
        googleId: datos.googleId, 
        avatarUrl: datos.avatarUrl,
        nombre: datos.nombre 
      }, 
      { returnDocument: 'after'} 
    ).exec();
  }

  async crearUsuarioManual(datos: { nombre: string, correo: string, rol: string }) {
    try {
      const nuevoUsuario = new this.usuarioModelo({
        nombre: datos.nombre,
        correo: datos.correo,
        rol: datos.rol
      });
      
      const usuarioGuardado = await nuevoUsuario.save();
      return {
        mensaje: 'Usuario registrado exitosamente en la lista de invitados',
        datos: usuarioGuardado
      };
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw new Error('No se pudo crear el usuario. ¿Quizás el correo ya existe en la base de datos?');
    }
  }

  async crearUsuarioAutomatico(perfilGoogle: any) 
  {
    const esAlumno = perfilGoogle.correo.endsWith('@alumnos.ucn.cl');
    const rolAsignado = esAlumno ? 'estudiante' : 'funcionario';

    const nuevoUsuario = new this.usuarioModelo({
      nombre: perfilGoogle.nombre,
      correo: perfilGoogle.correo,
      googleId: perfilGoogle.googleId,
      avatarUrl: perfilGoogle.avatarUrl,
      rol: rolAsignado,
      activo: true
    });

    return await nuevoUsuario.save();
  }

}