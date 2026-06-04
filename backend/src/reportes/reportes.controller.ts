import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post('generar')
  @UseGuards(AuthGuard('jwt'))
  async generarInforme(
    @Body('plantillaId') plantillaId: string,
    @Body('carpetaDestinoId') carpetaDestinoId: string,
    @Body('datosTexto') datosTexto: Record<string, string>,
    @Body('graficos') graficos: Record<string, string> 
  ) {
    return await this.reportesService.crearInformeAutomatizado(
      plantillaId, 
      carpetaDestinoId, 
      datosTexto, 
      graficos
    );
  }
}