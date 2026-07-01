import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EstadisticasRepository } from '../estadisticas.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; 
import type { Cache } from 'cache-manager';
interface CustomStore { reset?: () => Promise<void>; clear?: () => Promise<void>; }
interface CustomCache extends Cache { reset?: () => Promise<void>; store: CustomStore; }
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
    const cacheSeguro = this.cacheManager as unknown as CustomCache;
    try {
      if (typeof cacheSeguro.reset === 'function') await cacheSeguro.reset();
      else if (typeof cacheSeguro.store.reset === 'function') await cacheSeguro.store.reset();
      else if (typeof cacheSeguro.store.clear === 'function') await cacheSeguro.store.clear();
    } catch (e) {}
  }
  
  @OnEvent('formulario.desasignado')
  async limpiarEstadisticasHuerfanas(payload: { procesoId: string, tipoFormulario: string }) {
    console.log(`[Event Bus] Limpiando estadísticas del formulario ${payload.tipoFormulario} desasignado...`);
    await this.repositorio.eliminarEstadisticasPorFiltro({
      proceso_id: payload.procesoId,
      tipo_formulario: payload.tipoFormulario
    });
    const cacheSeguro = this.cacheManager as unknown as CustomCache;
    try {
      if (typeof cacheSeguro.reset === 'function') await cacheSeguro.reset();
      else if (typeof cacheSeguro.store.reset === 'function') await cacheSeguro.store.reset();
      else if (typeof cacheSeguro.store.clear === 'function') await cacheSeguro.store.clear();
    } catch (e) {}
  }
}