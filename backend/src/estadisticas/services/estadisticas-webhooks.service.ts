import { Injectable, NotFoundException } from '@nestjs/common';
import { mongo } from 'mongoose';
import { GoogleService } from '../../google/google.service';
import { FormulariosService } from 'src/formularios/formularios.service';
import { EstadisticasParserService } from './estadisticas-parser.service';
import { GoogleFormDiseno } from '../interfaces/diseno-google.interface';
import { GoogleFormRespuesta } from '../interfaces/respuesta-google.interface';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';
import { EstadisticasRepository } from '../estadisticas.repository';

@Injectable()
export class EstadisticasWebhooksService {
  constructor(
    private readonly googleService: GoogleService,
    private readonly parserService: EstadisticasParserService,
    private readonly repositorio: EstadisticasRepository,
    private readonly formulariosService: FormulariosService
  ) {}

  private async obtenerFechaUltimaSincronizacion(procesoId: string, tipoFormulario: TipoFormulario): Promise<Date | null> {
    const resultados = await this.repositorio.buscarPorQuery(
      { proceso_id: procesoId, tipo_formulario: tipoFormulario },
      'fecha_respuesta',
      { fecha_respuesta: -1 }
    );

    const ultima = resultados[0];
    return ultima ? ultima.fecha_respuesta : null;
  }

  async manejarNuevoWebhookGoogle(idFormulario: string, esSincronizacionManual: boolean = false) {
    const procesoAsociado = await this.formulariosService.buscarPorIdFormularioGoogle(idFormulario);
    if (!procesoAsociado) throw new NotFoundException('Formulario no encontrado en el sistema');

    const usuarioIdReal = procesoAsociado.usuario_id;
    const procesoIdReal = String(procesoAsociado._id);
    const tipoFormularioReal = procesoAsociado.formulario_estudiantes?.id_google_form === idFormulario 
      ? TipoFormulario.ESTUDIANTES : TipoFormulario.SOCIOS;

    const diseno = await this.googleService.obtenerDisenoFormulario(idFormulario);
    const disenoAdaptado = diseno as unknown as GoogleFormDiseno;

    let fechaFiltro: Date | undefined = undefined;
    
    if (!esSincronizacionManual) {
      const ultimaFecha = await this.obtenerFechaUltimaSincronizacion(procesoIdReal, tipoFormularioReal);
      if (ultimaFecha) {
        fechaFiltro = ultimaFecha;
      }
    }

    const listaRespuestas = await this.googleService.obtenerTodasLasRespuestas(idFormulario, fechaFiltro);

    if (!listaRespuestas || listaRespuestas.length === 0) return { estado: 'exito', guardadas: 0 };

    const idsRespuestasGoogle = listaRespuestas.map(r => r.responseId!);

    const encuestasExistentes = await this.repositorio.buscarPorQuery(
      { id_respuesta_google: { $in: idsRespuestasGoogle } },
      'id_respuesta_google'
    );
      
    const setIdsExistentes = new Set(encuestasExistentes.map(e => e.id_respuesta_google));
    
    type NuevaEstadistica = ReturnType<typeof this.parserService.procesarEncuesta> & { tipo_formulario: string };
    const nuevasEstadisticas: NuevaEstadistica[] = [];

    for (const respuestaCruda of listaRespuestas) {
      if (setIdsExistentes.has(respuestaCruda.responseId!)) continue;
      
      const respuestaAdaptada = respuestaCruda as unknown as GoogleFormRespuesta;

      const documentoListo = this.parserService.procesarEncuesta(
        disenoAdaptado, 
        respuestaAdaptada, 
        respuestaCruda.responseId!, 
        usuarioIdReal, 
        procesoIdReal
      );
      
      nuevasEstadisticas.push({
        ...documentoListo,
        tipo_formulario: tipoFormularioReal
      });
    }

    if (nuevasEstadisticas.length === 0) return { estado: 'exito', guardadas: 0 };

    let nuevasGuardadas = 0;
    try {
      const resultado = await this.repositorio.insertarMultiples(nuevasEstadisticas);
      nuevasGuardadas = resultado.length;
    } catch (error: unknown) {
      if (error instanceof mongo.MongoBulkWriteError && error.code === 11000) {
        nuevasGuardadas = error.insertedCount || 0;
        console.warn(`Aviso de concurrencia: Se ignoraron inserciones duplicadas al procesar el Webhook.`);
      } else {
        throw error
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
      const resultadoEstudiantes = await this.manejarNuevoWebhookGoogle(proceso.formulario_estudiantes.id_google_form, true);
      totalGuardadas += resultadoEstudiantes.guardadas;
      mensajes.push(`Estudiantes: ${resultadoEstudiantes.guardadas} respuestas recuperadas/nuevas.`);
    }

    if (proceso.formulario_socios?.id_google_form) {
      const resultadoSocios = await this.manejarNuevoWebhookGoogle(proceso.formulario_socios.id_google_form, true);
      totalGuardadas += resultadoSocios.guardadas;
      mensajes.push(`Socios: ${resultadoSocios.guardadas} respuestas recuperadas/nuevas.`);
    }

    return {
      estado: 'exito',
      mensaje: 'Sincronización manual completada.',
      total_nuevas_guardadas: totalGuardadas,
      detalle: mensajes
    };
  }
}