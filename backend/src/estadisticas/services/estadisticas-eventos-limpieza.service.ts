import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EstadisticasRepository } from '../estadisticas.repository';
import { CacheHelperService } from 'src/common/services/cache-helper.service';

@Injectable()
export class EstadisticasEventosLimpiezaService {
  constructor(
    private readonly repositorio: EstadisticasRepository,
    private readonly cacheHelper: CacheHelperService,
  ) {}

  @OnEvent('proceso.eliminado')
  async limpiarDatosHuerfanos(payload: { procesoId: string }): Promise<void> {
    console.log(`[Eventos] Escuché que se borró el proceso ${payload.procesoId}. Limpiando estadísticas...`);
    await this.repositorio.eliminarRespuestasPorProceso(payload.procesoId);
    await this.cacheHelper.limpiarCacheGlobal();
  }
  
  @OnEvent('formulario.desasignado')
  async limpiarEstadisticasHuerfanas(payload: { procesoId: string, tipoFormulario: string }) {
    console.log(`[Event Bus] Limpiando estadísticas del formulario ${payload.tipoFormulario} desasignado...`);
    await this.repositorio.eliminarEstadisticasPorFiltro({
      proceso_id: payload.procesoId,
      tipo_formulario: payload.tipoFormulario
    });
    await this.cacheHelper.limpiarCacheGlobal();
  }
}