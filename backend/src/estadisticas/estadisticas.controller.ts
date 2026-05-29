import { Controller, Post, Body, HttpCode, BadRequestException, Get, UseGuards, Req, Param, Query } from '@nestjs/common';
import { RecibirWebhookDto } from './dto/recibir-webhook.dto';
import { EstadisticasOrquestadorService } from './estadisticas-orquestador.service';
import { UsuarioActivo } from 'src/auth/interfaces/usuario-activo.interface';
import { AuthGuard } from '@nestjs/passport';

interface RequestConUsuario extends Request 
{
  user: UsuarioActivo;
}

@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly orquestador: EstadisticasOrquestadorService) {}

  @Post('webhook/respuestas')
  @HttpCode(200)
  async recibirNotificacionGoogle(@Body() cuerpoWebhook: any) {
    try {
      console.log('=== WEBHOOK RECIBIDO DE GOOGLE ===');

      // Extraemos los atributos donde Google Forms realmente manda la información
      const atributos = cuerpoWebhook?.message?.attributes;

      if (!atributos || !atributos.formId) {
        console.log('Webhook sin "formId". Ignorando...');
        return { estado: 'ignorado_sin_formId' };
      }

      if (atributos.eventType !== 'RESPONSES') {
        console.log(`Evento ignorado. Google envió: ${atributos.eventType}`);
        return { estado: 'ignorado_tipo_evento' };
      }

      const idFormulario = atributos.formId;
      
      // Llamamos al orquestador SOLO con el idFormulario (Google no nos da el id de respuesta)
      await this.orquestador.manejarNuevoWebhookGoogle(idFormulario);

      return { estado: 'recibido' };
    } catch (error) {
      console.error('Error al procesar el Webhook de Google:', error);
      return { estado: 'error_ignorado' };
    }
  }

  @Post(':idProceso/sincronizar-manual')
  @UseGuards(AuthGuard('jwt'))
  async sincronizarDatosManualmente(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string
  ) {
    return await this.orquestador.sincronizarProcesoManual(idProceso, req.user.userId);
  }

  @Get(':idProceso/resultados')
  @UseGuards(AuthGuard('jwt'))
  async obtenerResultadosFrontend(
    @Req() req: any, 
    @Param('idProceso') idProceso: string,
    @Query() filtros: any 
  ) {
    return await this.orquestador.obtenerResultadosTabulares(idProceso, req.user.userId, filtros);
  }

  @Get(':idProceso/metricas')
  @UseGuards(AuthGuard('jwt'))
  async obtenerMetricasFrontend(
    @Req() req: any,
    @Param('idProceso') idProceso: string,
    @Query() queryParams: any 
  ) {
    const { pagina, ...filtrosMongo } = queryParams;
    const paginaFiltroNum = pagina ? Number(pagina) : undefined;

    return await this.orquestador.obtenerMetricasAnaliticas(
      idProceso, 
      req.user.userId, 
      filtrosMongo, 
      paginaFiltroNum
    );
  }

  @Get(':idProceso/filtros-disponibles')
  @UseGuards(AuthGuard('jwt'))
  async obtenerOpcionesFiltros(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Query('tipo') tipo?: string 
  ) {
    const tipoSeguro = tipo || 'estudiantes'; 
    return await this.orquestador.obtenerOpcionesFiltrosDisponibles(idProceso, req.user.userId, tipoSeguro);
  }

}