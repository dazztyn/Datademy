import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EstadisticasRepository } from '../estadisticas.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; 
import type { Cache } from 'cache-manager';

type SafeCacheType = {
  clear?: () => Promise<unknown>;
  reset?: () => Promise<unknown>;
  store?: {
    clear?: () => Promise<unknown>;
    reset?: () => Promise<unknown>;
  };
};

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
    const cacheSeguro = this.cacheManager as unknown as SafeCacheType;
    try {
      if (typeof cacheSeguro.clear === 'function') {
        await cacheSeguro.clear();
      } else if (typeof cacheSeguro.reset === 'function') {
        await cacheSeguro.reset();
      } else if (cacheSeguro.store && typeof cacheSeguro.store.clear === 'function') {
        await cacheSeguro.store.clear();
      } else if (cacheSeguro.store && typeof cacheSeguro.store.reset === 'function') {
        await cacheSeguro.store.reset();
      }
    } catch (e) {
      console.error('Caché purgada o ignorada de forma segura');
    }
  }
  
  @OnEvent('formulario.desasignado')
  async limpiarEstadisticasHuerfanas(payload: { procesoId: string, tipoFormulario: string }) {
    console.log(`[Event Bus] Limpiando estadísticas del formulario ${payload.tipoFormulario} desasignado...`);
    await this.repositorio.eliminarEstadisticasPorFiltro({
      proceso_id: payload.procesoId,
      tipo_formulario: payload.tipoFormulario
    });
    const cacheSeguro = this.cacheManager as unknown as SafeCacheType;
    try {
      if (typeof cacheSeguro.clear === 'function') {
        await cacheSeguro.clear();
      } else if (typeof cacheSeguro.reset === 'function') {
        await cacheSeguro.reset();
      } else if (cacheSeguro.store && typeof cacheSeguro.store.clear === 'function') {
        await cacheSeguro.store.clear();
      } else if (cacheSeguro.store && typeof cacheSeguro.store.reset === 'function') {
        await cacheSeguro.store.reset();
      }
    } catch (e) {
      console.error('Caché purgada o ignorada de forma segura');
    }
  }
}