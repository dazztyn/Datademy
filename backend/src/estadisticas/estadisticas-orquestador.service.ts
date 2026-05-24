import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleService } from '../google/google.service';
import { EstadisticasService } from './estadisticas.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EstadisticaDocument } from './schemas/estadisticas.schema';
import { FormulariosService } from 'src/formularios/formularios.service';

@Injectable()
export class EstadisticasOrquestadorService {
  constructor(
    private readonly googleService: GoogleService,
    private readonly estadisticasService: EstadisticasService,
    @InjectModel('Estadistica') private readonly estadisticaModelo: Model<EstadisticaDocument>,
    private readonly formulariosService: FormulariosService
  ) {}

async manejarNuevoWebhookGoogle(idFormulario: string, idRespuestaGoogle: string) 
{

    const procesoAsociado = await this.formulariosService.buscarPorIdFormularioGoogle(idFormulario);
    
    if (!procesoAsociado) 
    {
      console.warn(`Webhook recibido para el formulario ${idFormulario}, pero no está registrado en la BD.`);
      throw new NotFoundException('Formulario no encontrado en el sistema');
    }

    const usuarioIdReal = procesoAsociado.usuario_id;
    const procesoIdReal = procesoAsociado._id.toString();
    
    // Determinamos de qué tipo era para guardarlo en la estadística
    const tipoFormularioReal = procesoAsociado.formulario_estudiantes?.id_google_form === idFormulario 
      ? 'estudiantes' 
      : 'socios';

    // 2. Traemos datos de Google
    const [diseno, respuestaCruda] = await Promise.all([
      this.googleService.obtenerDisenoFormulario(idFormulario),
      this.googleService.obtenerRespuestaEspecifica(idFormulario, idRespuestaGoogle)
    ]);

    // 3. Procesamos Matemáticas
    const documentoListo = this.estadisticasService.procesarEncuesta(
      diseno, 
      respuestaCruda, 
      idRespuestaGoogle, 
      usuarioIdReal, 
      procesoIdReal
    );

    // 4. Guardamos en MongoDB
    const nuevaEstadistica = new this.estadisticaModelo({
      ...documentoListo,
      tipo_formulario: tipoFormularioReal // Usamos el tipo real
    });
    
    await nuevaEstadistica.save();

    console.log(`¡ÉXITO! Estadística guardada para el proceso: ${procesoAsociado.nombre_proceso}`);
    return { estado: 'exito', idGuardado: nuevaEstadistica._id };
  }
}