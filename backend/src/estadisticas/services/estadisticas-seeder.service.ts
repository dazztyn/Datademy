import { Injectable} from '@nestjs/common';
import { EstadisticasRepository } from '../estadisticas.repository';

@Injectable()
export class EstadisticasSeederService {
  constructor(
    private readonly repositorio: EstadisticasRepository,
  ) {}

  async generarVolumenDummy(procesoId: string, usuarioId: string, cantidad: number) {
    let creados = 0;
    return { 
      estado: 'exito', 
      mensaje: `¡Se generaron ${creados} respuestas falsas exitosamente! Ya puedes ver tu dashboard.` 
    };
  }
}