import { Controller, Post, Body, Req, UseGuards, Patch, Get, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportesService } from './reportes.service';
import type { RequestConUsuario } from './interface/request-con-usuario.interface';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Controller('reportes')
@UseGuards(AuthGuard('jwt'))
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
    @InjectQueue('reportes') private readonly colaReportes: Queue
  ) {}

  @Patch('configurar')
  async configurarReportes(
    @Req() req: RequestConUsuario,
    @Body('idCarpeta') idCarpeta?: string,
    @Body('idPlantilla') idPlantilla?: string
  ) {
    return await this.reportesService.actualizarConfiguracion(req.user.userId, idCarpeta, idPlantilla);
  }

  @Post('generar')
    async solicitarGeneracionInforme(
      @Req() req: RequestConUsuario, 
      @Body() body: { datosTexto: Record<string, string>, graficos: Record<string, string>, nombreCarrera: string }
    ) {
    const job = await this.colaReportes.add('generar-informe', {
      usuarioId: req.user.userId,
      datosTexto: body.datosTexto,
      graficos: body.graficos,
      nombreCarrera: body.nombreCarrera
    },
    {
        removeOnComplete: true, 
        removeOnFail: 10,  
        attempts: 3,    
      }
    );

    return {
      estado: 'en_cola',
      mensaje: 'Tu informe se está generando en segundo plano.',
      jobId: job.id 
    };
  }
  
  @Get('estado/:jobId')
  async consultarEstadoInforme(@Param('jobId') jobId: string) {
    const job = await this.colaReportes.getJob(jobId);

    if (!job) {
      return { estado: 'no_encontrado', mensaje: 'El trabajo no existe.' };
    }

    const estadoJob = await job.getState(); 
    
    if (estadoJob === 'completed') {
      return {
        estado: 'completado',
        resultado: job.returnvalue
      };
    }

    if (estadoJob === 'failed') {
      return {
        estado: 'error',
        mensaje: job.failedReason
      };
    }

    return {
      estado: 'procesando',
      progreso: estadoJob
    };
  }
} 