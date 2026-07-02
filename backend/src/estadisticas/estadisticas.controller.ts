import { Controller, Post, Body, HttpCode, BadRequestException, Get, UseGuards, Req, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { EstadisticasWebhooksService } from './services/estadisticas-webhooks.service';
import { EstadisticasConsultasService } from './services/estadisticas-consultas.service';
import { UsuarioActivo } from 'src/auth/interfaces/usuario-activo.interface';
import { AuthGuard } from '@nestjs/passport';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';
import { EstadisticasComparativasService } from './services/estadisticas-comparativas.service';

interface RequestConUsuario extends Request {
  user: UsuarioActivo;
}

@Controller('estadisticas')
@UseGuards(AuthGuard('jwt'))
export class EstadisticasController {
  constructor(
    private readonly webhooksService: EstadisticasWebhooksService,
    private readonly consultasService: EstadisticasConsultasService,
    private readonly comparativasService: EstadisticasComparativasService,
  ) {}

  @Get('comparativa-global')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(86400000)
  async obtenerComparativaGlobal(
    @Req() req: RequestConUsuario,
    @Query('procesos') procesosUrl: string,
    @Query('tipo') tipo?: string
  ) {
    if (!procesosUrl) {
      throw new BadRequestException('Debes enviar al menos un ID de proceso para comparar (procesos=id1,id2)');
    }
    const procesosIds = procesosUrl.split(',');
    const tipoSeguro = (tipo as TipoFormulario) || TipoFormulario.ESTUDIANTES;

    return await this.comparativasService.obtenerComparativaGlobal(req.user.userId, procesosIds, tipoSeguro);
  }

  @Post(':idProceso/sincronizar-manual')
  async sincronizarDatosManualmente(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string
  ) {
    return await this.webhooksService.sincronizarProcesoManual(idProceso, req.user.userId);
  }

  @Get(':idProceso/resultados')
  async obtenerResultadosFrontend(
    @Req() req: RequestConUsuario, 
    @Param('idProceso') idProceso: string,
    @Query() filtros: Record<string, string> 
  ) {
    return await this.consultasService.obtenerResultadosTabulares(idProceso, req.user.userId, filtros);
  }

  @Get(':idProceso/metricas')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(86400000)
  async obtenerMetricasFrontend(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Query() queryParams: Record<string, string> 
  ) {
    const { pagina, ...filtrosMongo } = queryParams;
    const paginaFiltroNum = pagina ? Number(pagina) : undefined;

    return await this.consultasService.obtenerMetricasAnaliticas(
      idProceso, 
      req.user.userId, 
      filtrosMongo, 
      paginaFiltroNum
    );
  }

  @Get(':idProceso/filtros-disponibles')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(86400000)
  async obtenerOpcionesFiltros(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Query('tipo') tipo?: string 
  ) {
    const tipoSeguro = (tipo as TipoFormulario) || TipoFormulario.ESTUDIANTES;
    return await this.consultasService.obtenerOpcionesFiltrosDisponibles(idProceso, req.user.userId, tipoSeguro);
  }

  @Get(':idProceso/comparativa-interna')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(86400000)
  async obtenerComparativaInterna(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Query() queryParams: Record<string, string>
  ) {
    const { agruparPor, valores, tipo, ...filtrosAdicionales } = queryParams;

    if (!agruparPor) {
      throw new BadRequestException('Debes especificar por qué campo agrupar (ej. ?agruparPor=carrera o ?agruparPor=sede)');
    }
    
    const tipoSeguro = (tipo as TipoFormulario) || TipoFormulario.ESTUDIANTES;
    const valoresArray = valores ? valores.split(',') : undefined;
    
    return await this.comparativasService.obtenerComparativaInterna(
      req.user.userId, 
      idProceso, 
      agruparPor, 
      tipoSeguro,
      valoresArray,
      filtrosAdicionales // <--- Se lo pasamos al servicio
    );
  }
}