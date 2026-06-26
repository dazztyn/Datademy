import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proceso, ProcesoDocument } from './schemas/proceso.schema';
import { GoogleService } from '../google/google.service';
import { EstadisticasConsultasService } from '../estadisticas/estadisticas-consultas.service';

@Injectable()
export class FormulariosWorkerService {
  private readonly logger = new Logger(FormulariosWorkerService.name);

  constructor(
    @InjectModel(Proceso.name) private procesoModelo: Model<ProcesoDocument>,
    private readonly googleService: GoogleService,
    private readonly estadisticasService: EstadisticasConsultasService
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async procesarEliminacionesPendientes() {
    const procesosPendientes = await this.procesoModelo.find({ estado: 'borrado_pendiente' }).exec();

    if (procesosPendientes.length === 0) {
      return; 
    }

    this.logger.log(`Se encontraron ${procesosPendientes.length} procesos pendientes de borrado. Iniciando limpieza...`);

    for (const proceso of procesosPendientes) {
      try {
        if (proceso.formulario_socios && proceso.formulario_socios.id_google_form) {
          await this.googleService.enviarArchivoAPapelera(proceso.formulario_socios.id_google_form);
        }
        
        if (proceso.formulario_estudiantes && proceso.formulario_estudiantes.id_google_form) {
          await this.googleService.enviarArchivoAPapelera(proceso.formulario_estudiantes.id_google_form);
        }

        await this.estadisticasService.limpiarDatosHuerfanos(proceso._id.toString());

        await this.procesoModelo.findByIdAndDelete(proceso._id).exec();
        
        this.logger.log(`Proceso "${proceso.nombre_proceso}" eliminado exitosamente de Drive y MongoDB.`);

      } catch (error) 
      {
        this.logger.error(`Falló la eliminación en Drive para el proceso "${proceso.nombre_proceso}". Se reintentará en el próximo ciclo.`, error);
      }
    }
  }
}