import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EstadisticasRepository } from '../estadisticas.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; 
import type { Cache } from 'cache-manager';

@Injectable()
export class EstadisticasEventosLimpiezaService {
  constructor(
    private readonly repositorio: EstadisticasRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @OnEvent('proceso.eliminado')
  async limpiarDatosHuerfanos(payload: { procesoId: string }): Promise<void> {
    console.log(`[Eventos] Escuché que se borró el proceso ${payload.procesoId}. Limpiando estadísticas...`);
    await this.repositorio.eliminarRespuestasPorProceso(payload.procesoId);
    await this.cacheManager.del(`/api/estadisticas/${payload.procesoId}/metricas?tipo=estudiantes`);
    await this.cacheManager.del(`/api/estadisticas/${payload.procesoId}/metricas?tipo=socios`);
  }
  
  @OnEvent('formulario.desasignado')
  async limpiarEstadisticasHuerfanas(payload: { procesoId: string, tipoFormulario: string }) {
    console.log(`[Event Bus] Limpiando estadísticas del formulario ${payload.tipoFormulario} desasignado...`);
    await this.repositorio.eliminarEstadisticasPorFiltro({
      proceso_id: payload.procesoId,
      tipo_formulario: payload.tipoFormulario
    });
    await this.cacheManager.del(`/api/estadisticas/${payload.procesoId}/metricas?tipo=estudiantes`);
    await this.cacheManager.del(`/api/estadisticas/${payload.procesoId}/metricas?tipo=socios`);
  }
}