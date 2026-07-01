import { Injectable, NotFoundException } from '@nestjs/common';
import { mongo } from 'mongoose';
import { forms_v1 } from 'googleapis';
import { GoogleService } from '../../google/google.service';
import { EstadisticasParserService } from './estadisticas-parser.service';
import { GoogleFormDiseno } from '../interfaces/diseno-google.interface';
import { GoogleFormRespuesta } from '../interfaces/respuesta-google.interface';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';
import { EstadisticasRepository } from '../estadisticas.repository';
import { ProcesosService } from 'src/formularios/services/procesos.service';

@Injectable()
export class EstadisticasWebhooksService {
  constructor(
    private readonly procesosService: ProcesosService,
    private readonly googleService: GoogleService,
    private readonly parserService: EstadisticasParserService,
    private readonly repositorio: EstadisticasRepository
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
    const procesosAsociados = await this.procesosService.buscarTodosPorIdFormularioGoogle(idFormulario);
    if (!procesosAsociados || procesosAsociados.length === 0) { 
      throw new NotFoundException('Formulario no encontrado en ningún proceso del sistema');
    }

    const diseno = await this.googleService.obtenerDisenoFormulario(idFormulario);
    const disenoAdaptado = this.adaptarDisenoGoogle(diseno);
    let totalGuardadasGlobal = 0;

    for (const proceso of procesosAsociados) {
      const usuarioIdReal = proceso.usuario_id;
      const procesoIdReal = String(proceso._id);
      const tipoFormularioReal = proceso.formulario_estudiantes?.id_google_form === idFormulario 
        ? TipoFormulario.ESTUDIANTES : TipoFormulario.SOCIOS;

      let fechaFiltro: Date | undefined = undefined;
      if (!esSincronizacionManual) {
        const ultimaFecha = await this.obtenerFechaUltimaSincronizacion(procesoIdReal, tipoFormularioReal);
        if (ultimaFecha) fechaFiltro = ultimaFecha;
      }

      const listaRespuestas = await this.googleService.obtenerTodasLasRespuestas(idFormulario, fechaFiltro);
      if (!listaRespuestas || listaRespuestas.length === 0) continue;

      const idsRespuestasGoogle = listaRespuestas.map(r => r.responseId!);
      
      const encuestasExistentes = await this.repositorio.buscarPorQuery(
        { 
          id_respuesta_google: { $in: idsRespuestasGoogle },
          proceso_id: procesoIdReal 
        },
        'id_respuesta_google'
      );
      const setIdsExistentes = new Set(encuestasExistentes.map(e => e.id_respuesta_google));
      
      type NuevaEstadistica = ReturnType<typeof this.parserService.procesarEncuesta> & { tipo_formulario: string };
      const nuevasEstadisticas: NuevaEstadistica[] = [];

      for (const respuestaCruda of listaRespuestas) {
        if (setIdsExistentes.has(respuestaCruda.responseId!)) continue;

        const respuestaAdaptada = this.adaptarRespuestaGoogle(respuestaCruda);
        const documentoListo = this.parserService.procesarEncuesta(
          disenoAdaptado, respuestaAdaptada, respuestaCruda.responseId!, usuarioIdReal, procesoIdReal
        );
        
        nuevasEstadisticas.push({ ...documentoListo, tipo_formulario: tipoFormularioReal });
      }

      if (nuevasEstadisticas.length > 0) {
        try {
          const resultado = await this.repositorio.insertarMultiples(nuevasEstadisticas);
          totalGuardadasGlobal += resultado.length;
          console.log(`Guardadas ${resultado.length} respuestas para el proceso: ${proceso.nombre_proceso}`);
        } catch (error: any) {
          if (error.code === 11000) {
            console.warn(`Aviso de concurrencia en proceso ${proceso.nombre_proceso}.`);
          } else {
            throw error;
          }
        }
      }
    }

    return { estado: 'exito', guardadas: totalGuardadasGlobal };
  }

  async sincronizarProcesoManual(procesoId: string, usuarioId: string) {
    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
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

  private adaptarDisenoGoogle(diseno: forms_v1.Schema$Form): GoogleFormDiseno {
    return {
      items: (diseno.items || []).map(item => ({
        title: item.title || undefined,
        pageBreakItem: item.pageBreakItem ? {} : undefined,
        questionItem: item.questionItem ? {
          question: {
            questionId: item.questionItem.question?.questionId || '',
            choiceQuestion: item.questionItem.question?.choiceQuestion ? {
              options: (item.questionItem.question.choiceQuestion.options || []).map(opt => ({
                value: opt.value || ''
              }))
            } : undefined
          }
        } : undefined
      }))
    };
  }

  private adaptarRespuestaGoogle(respuesta: forms_v1.Schema$FormResponse): GoogleFormRespuesta {
    const answersMap: Record<string, any> = {};
    if (respuesta.answers) {
      Object.entries(respuesta.answers).forEach(([key, ans]) => {
        answersMap[key] = {
          textAnswers: {
            answers: (ans.textAnswers?.answers || []).map(t => ({ value: t.value || '' }))
          }
        };
      });
    }
    return {
      responseId: respuesta.responseId || '',
      createTime: respuesta.createTime || undefined,
      answers: answersMap
    };
  }

}