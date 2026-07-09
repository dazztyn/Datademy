import { Controller, Post, Body, Req, UseGuards, Patch, Get, Param, BadRequestException, Sse } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportesService } from './reportes.service';
import type { RequestConUsuario } from './interface/request-con-usuario.interface';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Observable } from 'rxjs';


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

  @Post(':idProceso/generar')
    async solicitarGeneracionInforme(
      @Req() req: RequestConUsuario,
      @Param( 'idProceso' )idProceso: string,
      @Body() body: 
      { 
        datosTexto: Record<string, string>, 
        graficos: Record<string, string>, 
        nombreCarrera: string,
        filtros?: Record<string, string>
      }
    ) {

    if (!idProceso) throw new BadRequestException('Falta idProceso');
    
    const job = await this.colaReportes.add('generar-informe', {
      usuarioId: req.user.userId,
      datosTexto: body.datosTexto,
      graficos: body.graficos,
      idProceso: idProceso,
      nombreCarrera: body.nombreCarrera,
      filtros: body.filtros || {}
    },
    {
        removeOnComplete: 10, 
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
  
  @Sse('estado/:jobId')
  consultarEstadoInforme(@Param('jobId') jobId: string): Observable<MessageEvent> {
    return new Observable((suscriptor) => {
      
      const onCompletado = (idJobTerminado: string, resultadoCrudo: string) => {
        if (idJobTerminado === jobId) {
          const resultado = typeof resultadoCrudo === 'string' ? JSON.parse(resultadoCrudo) : resultadoCrudo;
          suscriptor.next({ data: { estado: 'completado', resultado } } as MessageEvent);
          suscriptor.complete();
        }
      };

      const onFallido = (idJobFallido: string, error: Error) => {
        if (idJobFallido === jobId) {
          suscriptor.next({ data: { estado: 'error', mensaje: error.message } } as MessageEvent);
          suscriptor.complete(); 
        }
      };

      (async () => {
        try {
          const job = await this.colaReportes.getJob(jobId);
          if (!job) {
            suscriptor.next({ data: { estado: 'no_encontrado', mensaje: 'El trabajo no existe.' } } as MessageEvent);
            suscriptor.complete();
            return;
          }

          const estadoActual = await job.getState();
          
          if (estadoActual === 'completed') {
            suscriptor.next({ data: { estado: 'completado', resultado: job.returnvalue } } as MessageEvent);
            suscriptor.complete();
            return;
          }

          if (estadoActual === 'failed') {
            suscriptor.next({ data: { estado: 'error', mensaje: job.failedReason } } as MessageEvent);
            suscriptor.complete();
            return;
          }

          suscriptor.next({ data: { estado: 'procesando', progreso: estadoActual } } as MessageEvent);
          
          this.colaReportes.on('global:completed', onCompletado);
          this.colaReportes.on('global:failed', onFallido);

        } catch (error) {
          suscriptor.next({ data: { estado: 'error', mensaje: 'Error interno al consultar el trabajo.' } } as MessageEvent);
          suscriptor.complete();
        }
      })();

      return () => {
        this.colaReportes.removeListener('global:completed', onCompletado);
        this.colaReportes.removeListener('global:failed', onFallido);
      };
    });
  }
} 