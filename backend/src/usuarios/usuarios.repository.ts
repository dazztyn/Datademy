import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuarios.schema';

@Injectable()
export class UsuariosRepository {
  constructor(@InjectModel(Usuario.name) private readonly modelo: Model<UsuarioDocument>) {}

  async buscarPorCorreo(correo: string): Promise<UsuarioDocument | null> {
    return await this.modelo.findOne({ correo, activo: true }).exec();
  }

  async actualizarCuentaGoogle(id: string, datos: { googleId: string, avatarUrl: string, nombre: string }): Promise<UsuarioDocument | null> {
    return await this.modelo.findByIdAndUpdate(id, datos, { returnDocument: 'after' }).exec();
  }

  async crearUsuario(datos: Partial<Usuario>): Promise<UsuarioDocument> {
    const nuevoUsuario = new this.modelo(datos);
    return await nuevoUsuario.save();
  }
}