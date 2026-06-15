import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfiguracionReportes, ConfiguracionReportesDocument } from './schemas/configuracion-reportes.schema';

@Injectable()
export class ReportesConfigService {
  constructor(
    @InjectModel(ConfiguracionReportes.name) private configModelo: Model<ConfiguracionReportesDocument>
  ) {}

  async actualizarConfiguracion(usuarioId: string, idCarpeta?: string, idPlantilla?: string) {
    let config = await this.configModelo.findOne({ usuario_id: usuarioId }).exec();
    
    if (!config) {
      config = new this.configModelo({ usuario_id: usuarioId });
    }

    if (idCarpeta) config.id_carpeta_destino_informes = idCarpeta;
    if (idPlantilla) config.id_plantilla_informe = idPlantilla;

    await config.save();
    
    return { 
      estado: 'exito', 
      mensaje: 'Configuración actualizada correctamente.',
      configuracion_actual: {
        carpeta: config.id_carpeta_destino_informes || 'No configurada',
        plantilla: config.id_plantilla_informe || 'No configurada'
      }
    };
  }

  async obtenerConfiguracion(usuarioId: string) {
    const config = await this.configModelo.findOne({ usuario_id: usuarioId }).exec();
    if (!config || !config.id_carpeta_destino_informes || !config.id_plantilla_informe) {
      throw new BadRequestException('Falta configurar la carpeta de destino o la plantilla en los ajustes de reportes.');
    }
    return {
      carpetaDestinoId: config.id_carpeta_destino_informes,
      plantillaId: config.id_plantilla_informe
    };
  }
}