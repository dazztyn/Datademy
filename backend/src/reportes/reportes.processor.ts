import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { ReportesService } from './reportes.service';

@Processor('reportes')
export class ReportesProcessor {
  constructor(private readonly reportesService: ReportesService) {}

  @Process('generar-informe')
  async manejarGeneracionInforme(job: Job) 
  {
    console.log(`[Worker] Iniciando trabajo ${job.id} para el usuario ${job.data.usuarioId}...`);
    
    const { usuarioId, datosTexto, graficos, nombreCarrera } = job.data;

    try {
      const resultado = await this.reportesService.crearInformeAutomatizado(
        usuarioId, 
        datosTexto, 
        graficos, 
        nombreCarrera
      );
      
      console.log(`[Worker] Trabajo ${job.id} completado con éxito.`);
      return resultado; 
    } catch (error: any) {
      console.error(`[Worker] Error en el trabajo ${job.id}:`, error.message);
      throw error; 
    }
  }
}