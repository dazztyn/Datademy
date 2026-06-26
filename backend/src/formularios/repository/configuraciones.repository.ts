import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Configuracion, ConfiguracionDocument } from '../schemas/configuracion.schema';

@Injectable()
export class ConfiguracionesRepository {
  constructor(@InjectModel(Configuracion.name) private readonly modelo: Model<ConfiguracionDocument>) {}

  async encontrarConfiguracion(usuario_id: string): Promise<ConfiguracionDocument | null> {
    return await this.modelo.findOne({ usuario_id }).exec();
  }

  async guardarCarpetaDestino(usuario_id: string, idCarpeta: string): Promise<ConfiguracionDocument> {
    let config = await this.modelo.findOne({ usuario_id }).exec();
    if (config) {
      config.id_carpeta_destino_formularios = idCarpeta;
      return await config.save();
    } else {
      config = new this.modelo({ usuario_id, id_carpeta_destino_formularios: idCarpeta });
      return await config.save();
    }
  }
}