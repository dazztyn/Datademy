import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportesService } from './reportes.service';

@Controller('reportes')
@UseGuards(AuthGuard('jwt'))
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post('configurar')
  @UseGuards(AuthGuard('jwt'))
  async configurarReportes(
    @Req() req: any,
    @Body('idCarpeta') idCarpeta?: string,
    @Body('idPlantilla') idPlantilla?: string
  ) {
    return await this.reportesService.actualizarConfiguracion(req.user.userId, idCarpeta, idPlantilla);
  }

  @Post('generar')
  async generarInforme(
    @Req() req: any,
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