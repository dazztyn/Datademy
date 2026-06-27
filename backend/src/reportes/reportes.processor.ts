import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { ReportesService } from './reportes.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('reportes')
export class ReportesProcessor {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Process('generar-informe')
  async manejarGeneracionInforme(job: Job) 
  {
    console.log(`[Worker] Iniciando trabajo ${job.id} para el usuario ${job.data.usuarioId}...`);
    
    const { usuarioId, datosTexto, graficos,  nombreCarrera, idProceso, filtros } = job.data;

    try {

      const respuestasEventos = await this.eventEmitter.emitAsync(
        'estadisticas.solicitar_feedback', 
        {idProceso, filtros} 
      );
      
      const feedbackAgrupado = (respuestasEventos[0] || {}) as Record<string, string>;

      const datosTextoCompletos = {
        ...datosTexto,
        ...feedbackAgrupado
      };

      const resultado = await this.reportesService.crearInformeAutomatizado(
        usuarioId, 
        datosTextoCompletos, 
        graficos, 
        nombreCarrera
      );

      const urlDescargaPdf = `https://docs.google.com/document/d/${resultado.idDocumento}/export?format=pdf`;

      this.eventEmitter.emit('informe.generado', {
        usuarioId,
        idProceso,
        informe: {
          id_informe_drive: resultado.idDocumento,
          nombre_informe: resultado.nombreInforme,
          url_descarga: urlDescargaPdf,
          fecha_generacion: new Date()
        }
      });

      await job.update({ ...job.data, graficos: {} });
      console.log(`[Worker] Trabajo ${job.id} completado con éxito.`);

      return resultado; 
    } catch (error: any) {
      console.error(`[Worker] Error en el trabajo ${job.id}:`, error.message);
      throw error; 
    }
  }
}