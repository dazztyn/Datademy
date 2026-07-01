import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { Proceso, ProcesoDocument } from '../schemas/proceso.schema';
import { CrearProcesoDto } from '../dto/crear-proceso.dto';

@Injectable()
export class ProcesosRepository {
  constructor(@InjectModel(Proceso.name) private readonly modelo: Model<ProcesoDocument>) {}

  async eliminarProceso(id: string): Promise<void> {
    await this.modelo.findByIdAndDelete(id).exec();
  }

  async encontrarProcesosActivos(usuario_id: string): Promise<ProcesoDocument[]> {
    return await this.modelo.find({ usuario_id, estado: 'activo' }).sort({ createdAt: -1 }).exec();
  }

  async encontrarProcesoPorId(usuario_id: string, id: string): Promise<ProcesoDocument | null> {
    return await this.modelo.findOne({ _id: id, usuario_id }).exec();
  }

  async encontrarProcesosPendientesDeBorrado(): Promise<ProcesoDocument[]> {
    return await this.modelo.find({ estado: 'borrado_pendiente' }).exec();
  }

  async buscarTodosPorIdFormularioGoogle(idFormulario: string): Promise<ProcesoDocument[]> {
    return await this.modelo.find({
      $or: [
        { 'formulario_estudiantes.id_google_form': idFormulario },
        { 'formulario_socios.id_google_form': idFormulario }
      ]
    }).exec();
  }

  async buscarProcesosPorUsuarioYFormulario(usuarioId: string, idFormulario: string): Promise<ProcesoDocument[]> {
    return await this.modelo.find({
      usuario_id: usuarioId,
      $or: [
        { 'formulario_estudiantes.id_google_form': idFormulario },
        { 'formulario_socios.id_google_form': idFormulario }
      ]
    }).exec();
  }

  async crearProceso(datos: CrearProcesoDto & { usuario_id: string }): Promise<ProcesoDocument> {
    const nuevoProceso = new this.modelo(datos);
    return await nuevoProceso.save();
  }

  async actualizarProceso(usuario_id: string, id: string, datos: UpdateQuery<ProcesoDocument>): Promise<ProcesoDocument | null> {
    return await this.modelo.findOneAndUpdate({ _id: id, usuario_id }, datos, { returnDocument: 'after' }).exec();
  }

  async eliminarProcesoFisico(usuario_id: string, idProceso: string) {
    return await this.modelo.findOneAndDelete({ _id: idProceso, usuario_id }).exec();
  }

}