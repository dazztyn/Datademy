import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuarios.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    private eventEmitter: EventEmitter2 
  ) {}

  async obtenerTodosLosUsuarios() {
    return await this.usuarioModel.find().select('-refresh_token -google_access_token');
  }

  async agregarUsuario(correo: string, nombre: string, rol: string = 'profesor', activo: boolean = true) {
    const existe = await this.usuarioModel.findOne({ correo });
    if (existe) {
      throw new BadRequestException('El usuario ya existe en la base de datos');
    }

    const nuevoUsuario = new this.usuarioModel({ correo, nombre, rol, activo });
    await nuevoUsuario.save();
    return { estado: 'exito', mensaje: 'Usuario agregado correctamente' };
  }

  async eliminarUsuarioYDatos(usuarioIdParaBorrar: string, adminEjecutandoId: string) {
    if (usuarioIdParaBorrar === adminEjecutandoId) {
      throw new BadRequestException('No puedes auto-eliminarte de la plataforma.');
    }

    const usuario = await this.usuarioModel.findById(usuarioIdParaBorrar);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    
    await this.usuarioModel.findByIdAndDelete(usuarioIdParaBorrar);
    
    this.eventEmitter.emit('usuario.eliminado', usuarioIdParaBorrar);
    
    return { 
      estado: 'exito', 
      mensaje: `Usuario ${usuario.correo} eliminado. Limpieza en segundo plano iniciada.`
    };
  }
}