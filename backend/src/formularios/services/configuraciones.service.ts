import { Injectable } from '@nestjs/common';
import { ConfiguracionesRepository } from '../repository/configuraciones.repository';

@Injectable()
export class ConfiguracionesService {
  constructor(private readonly configRepo: ConfiguracionesRepository) {}

  async guardarCarpetaDestino(usuario_id: string, idCarpeta: string) {
    await this.configRepo.guardarCarpetaDestino(usuario_id, idCarpeta);
    return { estado: 'exito' };
  }

  async obtenerCarpetaDestino(usuario_id: string): Promise<string> {
    const config = await this.configRepo.encontrarConfiguracion(usuario_id);
    if (!config || !config.id_carpeta_destino_formularios) {
      throw new Error('No se ha configurado una carpeta de destino.');
    }
    return config.id_carpeta_destino_formularios;
  }
}