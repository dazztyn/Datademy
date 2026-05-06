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

  // Actualiza el perfil vacío con los datos reales de Google en el primer login
  async vincularCuentaGoogle(id: any, datos: { googleId: string, avatarUrl: string, nombre: string }) {
    return await this.usuarioModelo.findByIdAndUpdate(
      id, 
      { 
        googleId: datos.googleId, 
        avatarUrl: datos.avatarUrl,
        nombre: datos.nombre // Actualiza el nombre por el que viene de Google
      }, 
      { returnDocument: 'after'} // Devuelve el documento actualizado
    ).exec();
  }

  // 3. Función para registrar manualmente a alguien (fase temprana de pruebas)
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

  // funcion para crear un usuario al registrarse con google
  async crearUsuarioAutomatico(perfilGoogle: any) {
    // a futuro hacer esto con @ucn.cl para funcionarios
    const esAlumno = perfilGoogle.correo.endsWith('@alumnos.ucn.cl');
    const rolAsignado = esAlumno ? 'estudiante' : 'funcionario';

    const nuevoUsuario = new this.usuarioModelo({
      nombre: perfilGoogle.nombre,
      correo: perfilGoogle.correo,
      googleId: perfilGoogle.googleId,
      avatarUrl: perfilGoogle.avatarUrl,
      rol: rolAsignado, // Asigna 'estudiante' o 'funcionario'
      activo: true
    });

    return await nuevoUsuario.save();
  }

}