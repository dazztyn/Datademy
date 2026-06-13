import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleService } from '../google/google.service';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticaDocument } from './schemas/estadisticas.schema';
import { FormulariosService } from 'src/formularios/formularios.service';

@Injectable()
export class EstadisticasWebhooksService {
  constructor(
    private readonly googleService: GoogleService,
    private readonly estadisticasService: EstadisticasService,
    @InjectModel('Estadistica') private readonly estadisticaModelo: Model<EstadisticaDocument>,
    private readonly formulariosService: FormulariosService
  ) {}

  async manejarNuevoWebhookGoogle(idFormulario: string) {
    const procesoAsociado = await this.formulariosService.buscarPorIdFormularioGoogle(idFormulario);
    if (!procesoAsociado) throw new NotFoundException('Formulario no encontrado en el sistema');

    const usuarioIdReal = procesoAsociado.usuario_id;
    const procesoIdReal = procesoAsociado._id.toString();
    const tipoFormularioReal = procesoAsociado.formulario_estudiantes?.id_google_form === idFormulario 
      ? 'estudiantes' : 'socios';

    const diseno = await this.googleService.obtenerDisenoFormulario(idFormulario);
    const listaRespuestas = await this.googleService.obtenerTodasLasRespuestas(idFormulario);

    let nuevasGuardadas = 0;

    for (const respuestaCruda of listaRespuestas) {
      const idRespuestaGoogle = respuestaCruda.responseId;

      const existe = await this.estadisticaModelo.exists({ id_respuesta_google: idRespuestaGoogle });
      if (existe) continue; 

      const documentoListo = this.estadisticasService.procesarEncuesta(
        diseno, 
        respuestaCruda, 
        idRespuestaGoogle, 
        usuarioIdReal, 
        procesoIdReal
      );

      const nuevaEstadistica = new this.estadisticaModelo({
        ...documentoListo,
        tipo_formulario: tipoFormularioReal
      });
      try {
        await nuevaEstadistica.save();
        nuevasGuardadas++;
      } catch (error: any) {
        if (error.code === 11000) {
          console.warn(`Aviso: Intento de guardar respuesta duplicada evitado (${idRespuestaGoogle})`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n¡ÉXITO! Se guardaron ${nuevasGuardadas} respuestas nuevas para: ${procesoAsociado.nombre_proceso}\n`);
    return { estado: 'exito', guardadas: nuevasGuardadas };
  }

  async sincronizarProcesoManual(procesoId: string, usuarioId: string) {
    const proceso = await this.formulariosService.obtenerProcesoInterno(usuarioId, procesoId);
    
    let totalGuardadas = 0;
    let mensajes: string[] = [];

    if (proceso.formulario_estudiantes?.id_google_form) {
      const resultadoEstudiantes = await this.manejarNuevoWebhookGoogle(proceso.formulario_estudiantes.id_google_form);
      totalGuardadas += resultadoEstudiantes.guardadas;
      mensajes.push(`Estudiantes: ${resultadoEstudiantes.guardadas} respuestas nuevas.`);
    }

    if (proceso.formulario_socios?.id_google_form) {
      const resultadoSocios = await this.manejarNuevoWebhookGoogle(proceso.formulario_socios.id_google_form);
      totalGuardadas += resultadoSocios.guardadas;
      mensajes.push(`Socios: ${resultadoSocios.guardadas} respuestas nuevas.`);
    }

    return {
      estado: 'exito',
      mensaje: 'Sincronización manual completada.',
      total_nuevas_guardadas: totalGuardadas,
      detalle: mensajes
    };
  }
}