import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfiguracionReportes, ConfiguracionReportesDocument } from './schemas/configuracion-reportes.schema';

@Injectable()
export class ReportesRepository {
  constructor(@InjectModel(ConfiguracionReportes.name) private readonly modelo: Model<ConfiguracionReportesDocument>) {}

  async encontrarConfiguracion(usuario_id: string): Promise<ConfiguracionReportesDocument | null> {
    return await this.modelo.findOne({ usuario_id }).exec();
  }

  async guardarConfiguracion(usuario_id: string, idCarpeta?: string, idPlantilla?: string): Promise<ConfiguracionReportesDocument> {
    let config = await this.modelo.findOne({ usuario_id }).exec();
    
    if (!config) {
      config = new this.modelo({ usuario_id });
    }

    if (idCarpeta) config.id_carpeta_destino_informes = idCarpeta;
    if (idPlantilla) config.id_plantilla_informe = idPlantilla;

    return await config.save();
  }
}