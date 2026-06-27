import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { ReportesService } from './reportes.service';
import { ProcesosService } from 'src/formularios/services/procesos.service';

@Processor('reportes')
export class ReportesProcessor {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly procesosService: ProcesosService
  ) {}

  @Process('generar-informe')
  async manejarGeneracionInforme(job: Job) 
  {
    console.log(`[Worker] Iniciando trabajo ${job.id} para el usuario ${job.data.usuarioId}...`);
    
    const { usuarioId, datosTexto, graficos,  nombreCarrera, idProceso } = job.data;

    try {
      const resultado = await this.reportesService.crearInformeAutomatizado(
        usuarioId, 
        datosTexto, 
        graficos, 
        nombreCarrera
      );

      const urlDescargaPdf = `https://docs.google.com/document/d/${resultado.idDocumento}/export?format=pdf`;
      await this.procesosService.guardarInformeEnProceso(usuarioId, idProceso, {
        id_informe_drive: resultado.idDocumento,
        nombre_informe: resultado.nombreInforme,
        url_descarga: urlDescargaPdf
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