import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportesRepository } from './reportes.repository';

@Injectable()
export class ReportesConfigService {
  constructor(
    private readonly repositorio: ReportesRepository
  ) {}

  async actualizarConfiguracion(usuarioId: string, idCarpeta?: string, idPlantilla?: string) {
    
    const config = await this.repositorio.guardarConfiguracion(usuarioId, idCarpeta, idPlantilla);
    
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
    
    const config = await this.repositorio.encontrarConfiguracion(usuarioId);

    if (!config || !config.id_carpeta_destino_informes || !config.id_plantilla_informe) {
      throw new BadRequestException('Falta configurar la carpeta de destino o la plantilla en los ajustes de reportes.');
    }
    return {
      carpetaDestinoId: config.id_carpeta_destino_informes,
      plantillaId: config.id_plantilla_informe
    };
  }
}