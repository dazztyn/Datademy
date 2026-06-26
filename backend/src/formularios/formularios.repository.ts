import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { Proceso, ProcesoDocument } from './schemas/proceso.schema';
import { Plantilla, PlantillaDocument } from './schemas/plantilla.schema';
import { Configuracion, ConfiguracionDocument } from './schemas/configuracion.schema';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { FiltroPlantillas } from './interfaces/FiltroPlantillas';

@Injectable()
export class FormulariosRepository {
  constructor(
    @InjectModel(Proceso.name) private readonly procesoModelo: Model<ProcesoDocument>,
    @InjectModel(Plantilla.name) private readonly plantillaModelo: Model<PlantillaDocument>,
    @InjectModel(Configuracion.name) private readonly configuracionModelo: Model<ConfiguracionDocument>,
  ) {}

  async eliminarProceso(id: string): Promise<void> {
    await this.procesoModelo.findByIdAndDelete(id).exec();
  }

  async encontrarProcesosActivos(usuario_id: string): Promise<ProcesoDocument[]> {
    return await this.procesoModelo.find({ usuario_id, estado: 'activo' }).sort({ createdAt: -1 }).exec();
  }

  async encontrarProcesoPorId(usuario_id: string, id: string): Promise<ProcesoDocument | null> {
    return await this.procesoModelo.findOne({ _id: id, usuario_id }).exec();
  }

  async encontrarProcesosPendientesDeBorrado(): Promise<ProcesoDocument[]> {
    return await this.procesoModelo.find({ estado: 'borrado_pendiente' }).exec();
  }

  async buscarPorIdFormularioGoogle(idFormulario: string): Promise<ProcesoDocument | null> {
    return await this.procesoModelo.findOne({
      $or: [
        { 'formulario_estudiantes.id_google_form': idFormulario },
        { 'formulario_socios.id_google_form': idFormulario }
      ]
    }).exec();
  }

  async crearProceso(datos: CrearProcesoDto & { usuario_id: string }): Promise<ProcesoDocument> {
    const nuevoProceso = new this.procesoModelo(datos);
    return await nuevoProceso.save();
  }

  async actualizarProceso(usuario_id: string, id: string, datos: UpdateQuery<ProcesoDocument>): Promise<ProcesoDocument | null> {
    return await this.procesoModelo
      .findOneAndUpdate({ _id: id, usuario_id }, datos, { returnDocument: 'after' })
      .exec();
  }

  async borrarPlantillas(usuario_id: string): Promise<void> {
    await this.plantillaModelo.deleteMany({ usuario_id }).exec();
  }

  async insertarPlantillas(plantillas: Partial<Plantilla>[]): Promise<PlantillaDocument[]> {
    return await this.plantillaModelo.insertMany(plantillas);
  }

  async encontrarPlantillas(filtro: FiltroPlantillas): Promise<PlantillaDocument[]> {
    return await this.plantillaModelo.find(filtro).exec();
  }

  async encontrarConfiguracion(usuario_id: string): Promise<ConfiguracionDocument | null> {
    return await this.configuracionModelo.findOne({ usuario_id }).exec();
  }

  async guardarCarpetaDestino(usuario_id: string, idCarpeta: string): Promise<ConfiguracionDocument> {
    let config = await this.configuracionModelo.findOne({ usuario_id }).exec();
    if (config) {
      config.id_carpeta_destino_formularios = idCarpeta;
      return await config.save();
    } else {
      config = new this.configuracionModelo({ usuario_id, id_carpeta_destino_formularios: idCarpeta });
      return await config.save();
    }
  }
}