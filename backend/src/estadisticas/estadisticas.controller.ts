import { Controller, Post, Body, HttpCode, BadRequestException, Get, UseGuards, Req, Param, Query } from '@nestjs/common';
import { EstadisticasWebhooksService } from './services/estadisticas-webhooks.service';
import { EstadisticasConsultasService } from './services/estadisticas-consultas.service';
import { EstadisticasSeederService } from './services/estadisticas-seeder.service';
import { UsuarioActivo } from 'src/auth/interfaces/usuario-activo.interface';
import { AuthGuard } from '@nestjs/passport';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';

interface RequestConUsuario extends Request {
  user: UsuarioActivo;
}

@Controller('estadisticas')
@UseGuards(AuthGuard('jwt'))
export class EstadisticasController {
  constructor(
    private readonly webhooksService: EstadisticasWebhooksService,
    private readonly consultasService: EstadisticasConsultasService,
    private readonly seederService: EstadisticasSeederService
  ) {}

  @Post(':idProceso/generar-dummy')
  async generarDatosPrueba(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Body('cantidad') cantidad: number
  ) {
    const cantidadSegura = cantidad || 50; 
    return await this.seederService.generarVolumenDummy(idProceso, req.user.userId, cantidadSegura);
  }

  @Get('comparativa-global')
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

    return await this.consultasService.obtenerComparativaGlobal(req.user.userId, procesosIds, tipoSeguro);
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
  async obtenerOpcionesFiltros(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Query('tipo') tipo?: string 
  ) {
    const tipoSeguro = (tipo as TipoFormulario) || TipoFormulario.ESTUDIANTES;
    return await this.consultasService.obtenerOpcionesFiltrosDisponibles(idProceso, req.user.userId, tipoSeguro);
  }
}