import { Controller, Post, Body, HttpCode, BadRequestException, Get, UseGuards, Req, Param, Query } from '@nestjs/common';
import { EstadisticasWebhooksService } from './estadisticas-webhooks.service';
import { EstadisticasConsultasService } from './estadisticas-consultas.service';
import { EstadisticasSeederService } from './estadisticas-seeder.service';
import { UsuarioActivo } from 'src/auth/interfaces/usuario-activo.interface';
import { AuthGuard } from '@nestjs/passport';

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

  @Post('webhook/respuestas')
  @HttpCode(200)
  async recibirNotificacionGoogle(@Body() cuerpoWebhook: any) {
    try {
      console.log('=== WEBHOOK RECIBIDO DE GOOGLE ===');
      const atributos = cuerpoWebhook?.message?.attributes;

      if (!atributos || !atributos.formId) {
        console.log('Webhook sin "formId". Ignorando...');
        return { estado: 'ignorado_sin_formId' };
      }

      if (atributos.eventType !== 'RESPONSES') {
        console.log(`Evento ignorado. Google envió: ${atributos.eventType}`);
        return { estado: 'ignorado_tipo_evento' };
      }

      await this.webhooksService.manejarNuevoWebhookGoogle(atributos.formId);
      return { estado: 'recibido' };
    } catch (error) {
      console.error('Error al procesar el Webhook de Google:', error);
      return { estado: 'error_ignorado' };
    }
  }

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
    const tipoSeguro = tipo || 'estudiantes';

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
    @Req() req: any, 
    @Param('idProceso') idProceso: string,
    @Query() filtros: any 
  ) {
    return await this.consultasService.obtenerResultadosTabulares(idProceso, req.user.userId, filtros);
  }

  @Get(':idProceso/metricas')
  async obtenerMetricasFrontend(
    @Req() req: any,
    @Param('idProceso') idProceso: string,
    @Query() queryParams: any 
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
    const tipoSeguro = tipo || 'estudiantes'; 
    return await this.consultasService.obtenerOpcionesFiltrosDisponibles(idProceso, req.user.userId, tipoSeguro);
  }
}