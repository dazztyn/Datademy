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

  async manejarNuevoWebhookGoogle(idFormulario: string) 
  {
    // 1. DESCUBRIMOS AL DUEÑO
    const procesoAsociado = await this.formulariosService.buscarPorIdFormularioGoogle(idFormulario);
    if (!procesoAsociado) throw new NotFoundException('Formulario no encontrado en el sistema');

    const usuarioIdReal = procesoAsociado.usuario_id;
    const procesoIdReal = procesoAsociado._id.toString();
    const tipoFormularioReal = procesoAsociado.formulario_estudiantes?.id_google_form === idFormulario 
      ? 'estudiantes' : 'socios';

    // 2. Traemos el diseño y TODAS las respuestas del formulario
    const diseno = await this.googleService.obtenerDisenoFormulario(idFormulario);
    const listaRespuestas = await this.googleService.obtenerTodasLasRespuestas(idFormulario);

    let nuevasGuardadas = 0;

    // 3. Procesamos y guardamos SOLO las respuestas nuevas
    for (const respuestaCruda of listaRespuestas) {
      const idRespuestaGoogle = respuestaCruda.responseId;

      // Magia Clean Code: Preguntamos a MongoDB si ya guardamos este ID antes
      const existe = await this.estadisticaModelo.exists({ id_respuesta_google: idRespuestaGoogle });
      if (existe) continue; // Si ya existe, saltamos al siguiente

      // Si no existe, usamos nuestro motor matemático para procesarla
      const documentoListo = this.estadisticasService.procesarEncuesta(
        diseno, 
        respuestaCruda, 
        idRespuestaGoogle, 
        usuarioIdReal, 
        procesoIdReal
      );

      // Guardamos en MongoDB
      const nuevaEstadistica = new this.estadisticaModelo({
        ...documentoListo,
        tipo_formulario: tipoFormularioReal
      });
      await nuevaEstadistica.save();
      nuevasGuardadas++;
    }

    console.log(`\n¡ÉXITO! Se guardaron ${nuevasGuardadas} respuestas nuevas para: ${procesoAsociado.nombre_proceso}\n`);
    return { estado: 'exito', guardadas: nuevasGuardadas };
  }
}