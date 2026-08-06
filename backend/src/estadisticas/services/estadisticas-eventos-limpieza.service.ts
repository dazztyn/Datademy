import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EstadisticasRepository } from '../estadisticas.repository';
import { CacheHelperService } from '../../common/services/cache-helper.service';

@Injectable()
export class EstadisticasEventosLimpiezaService {
  
  constructor(
    private readonly repositorio: EstadisticasRepository,
    private readonly cacheHelper: CacheHelperService,
  ) {}
  
  @OnEvent('proceso.eliminado')
  async limpiarDatosHuerfanos(payload: { procesoId: string }): Promise<void> {
    if (!payload || !payload.procesoId) return;
    await this.repositorio.eliminarRespuestasPorProceso(payload.procesoId);
    await this.cacheHelper.limpiarCacheGlobal();
  }

  @OnEvent('formulario.desasignado')
  async limpiarEstadisticasHuerfanas(payload: { procesoId: string, tipoFormulario: string }) {
    if (!payload?.procesoId || !payload?.tipoFormulario) return;
    await this.repositorio.eliminarEstadisticasPorFiltro({
      proceso_id: payload.procesoId,
      tipo_formulario: payload.tipoFormulario
    });
    await this.cacheHelper.limpiarCacheGlobal();
  }

  @OnEvent('usuario.eliminado')
  async limpiarEstadisticasUsuario(usuarioId: string) {
    await this.repositorio.eliminarEstadisticasPorFiltro({ usuario_id: usuarioId });
    await this.cacheHelper.limpiarCacheGlobal();
  }
}