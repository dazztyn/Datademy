import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProcesosRepository } from './repository/procesos.repository';
import { GoogleDriveService } from 'src/google/services/google-drive.service';

@Injectable()
export class FormulariosWorkerService {
  private readonly logger = new Logger(FormulariosWorkerService.name);

  constructor(
    private readonly procesosRepo: ProcesosRepository,
    private readonly googleDriveService: GoogleDriveService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async procesarEliminacionesPendientes() {
    const procesosPendientes = await this.procesosRepo.encontrarProcesosPendientesDeBorrado();

    if (procesosPendientes.length === 0) {
      return; 
    }

    this.logger.log(`Se encontraron ${procesosPendientes.length} procesos pendientes de borrado. Iniciando limpieza...`);

    for (const proceso of procesosPendientes) {
      try {
        if (proceso.formulario_socios && proceso.formulario_socios.id_google_form) {
          await this.googleDriveService.enviarArchivoAPapelera(proceso.formulario_socios.id_google_form);
        }
        
        if (proceso.formulario_estudiantes && proceso.formulario_estudiantes.id_google_form) {
          await this.googleDriveService.enviarArchivoAPapelera(proceso.formulario_estudiantes.id_google_form);
        }

        this.eventEmitter.emit('proceso.eliminado', proceso._id.toString());

        await this.procesosRepo.eliminarProceso(proceso._id.toString());

        this.logger.log(`Proceso "${proceso.nombre_proceso}" eliminado exitosamente de Drive y MongoDB.`);

      } catch (error) 
      {
        this.logger.error(`Falló la eliminación en Drive para el proceso "${proceso.nombre_proceso}". Se reintentará en el próximo ciclo.`, error);
      }
    }
  }
}