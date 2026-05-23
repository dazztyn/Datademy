import { Injectable } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { EstadisticasService } from './estadisticas.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EstadisticaDocument } from './schemas/estadisticas.schema';

@Injectable()
export class EstadisticasOrquestadorService {
  constructor(
    private readonly googleService: GoogleService,
    private readonly estadisticasService: EstadisticasService,
    @InjectModel('Estadistica') private readonly estadisticaModelo: Model<EstadisticaDocument>
  ) {}

  async manejarNuevoWebhookGoogle(idFormulario: string, idRespuestaGoogle: string, usuarioId: string, procesoId: string) {
    
    // 1. Hablamos con la infraestructura externa (Google)
    const [diseno, respuestaCruda] = await Promise.all([
      this.googleService.obtenerDisenoFormulario(idFormulario),
      this.googleService.obtenerRespuestaEspecifica(idFormulario, idRespuestaGoogle)
    ]);

    // 2. Le pasamos los datos crudos a nuestra lógica de negocio pura (Desacoplado)
    const documentoListo = this.estadisticasService.procesarEncuesta(
      diseno, 
      respuestaCruda, 
      idRespuestaGoogle, 
      usuarioId, 
      procesoId
    );

    // 3. Guardamos en la base de datos
    const nuevaEstadistica = new this.estadisticaModelo(documentoListo);
    await nuevaEstadistica.save();

    return { estado: 'exito', idGuardado: nuevaEstadistica._id };
  }
}