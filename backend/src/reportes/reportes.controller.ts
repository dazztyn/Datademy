import { Controller, Post, Body, Req, UseGuards, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportesService } from './reportes.service';
import type { RequestConUsuario } from './interface/request-con-usuario.interface';

@Controller('reportes')
@UseGuards(AuthGuard('jwt'))
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Patch('configurar')
  async configurarReportes(
    @Req() req: RequestConUsuario,
    @Body('idCarpeta') idCarpeta?: string,
    @Body('idPlantilla') idPlantilla?: string
  ) {
    return await this.reportesService.actualizarConfiguracion(req.user.userId, idCarpeta, idPlantilla);
  }

  @Post('generar')
  async generarInforme(
    @Req() req: RequestConUsuario,
    @Body('datosTexto') datosTexto: Record<string, string>,
    @Body('graficos') graficos: Record<string, string>, 
    @Body('nombreCarrera') nombreCarrera?: string
  ) {
    return await this.reportesService.crearInformeAutomatizado(
      req.user.userId, 
      datosTexto, 
      graficos,
      nombreCarrera
    );
  }
}