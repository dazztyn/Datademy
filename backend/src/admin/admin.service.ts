import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuarios.schema'; 
import { Proceso, ProcesoDocument } from '../formularios/schemas/proceso.schema';
import { Estadistica, EstadisticaDocument } from '../estadisticas/schemas/estadisticas.schema';
import { ConfiguracionReportes, ConfiguracionReportesDocument } from '../reportes/schemas/configuracion-reportes.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(Proceso.name) private procesoModel: Model<ProcesoDocument>,
    @InjectModel(Estadistica.name) private estadisticaModel: Model<EstadisticaDocument>,
    @InjectModel(ConfiguracionReportes.name) private reportesModel: Model<ConfiguracionReportesDocument>
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
    
    const statsAfectadas = await this.estadisticaModel.deleteMany({ usuario_id: usuarioIdParaBorrar });
    const procesosAfectados = await this.procesoModel.deleteMany({ usuario_id: usuarioIdParaBorrar });
    const reportesAfectados = await this.reportesModel.deleteMany({ usuario_id: usuarioIdParaBorrar });
    await this.usuarioModel.findByIdAndDelete(usuarioIdParaBorrar);

    return { 
      estado: 'exito', 
      mensaje: `Usuario ${usuario.correo} eliminado por completo`,
      detalles: {
        respuestas_borradas: statsAfectadas.deletedCount,
        procesos_borrados: procesosAfectados.deletedCount,
        configs_reportes_borradas: reportesAfectados.deletedCount
      }
    };
  }
}