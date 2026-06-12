import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      await nuevaEstadistica.save();
      nuevasGuardadas++;
    }
    return { estado: 'exito', guardadas: nuevasGuardadas };
  }

  private readonly mapaFiltrosMongo: Record<string, string> = {
    tipo: 'tipo_formulario',
    carrera: 'datos_respondente.carrera',
    genero: 'datos_respondente.genero',
    sede: 'datos_respondente.sede',
    nivel_formativo: 'datos_respondente.nivel_formativo',
    organizacion: 'datos_respondente.organizacion'
  };

  async obtenerResultadosTabulares(procesoId: string, usuarioId: string, filtros: Record<string, string>) 
  {
    const queryMongo: Record<string, any> = { proceso_id: procesoId, usuario_id: usuarioId };

    Object.entries(filtros)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '') 
      .forEach(([llaveFrontend, valor]) => {
        const campoMapeadoMongo = this.mapaFiltrosMongo[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor; 
        }
      });

    const estadisticas = await this.estadisticaModelo
      .find(queryMongo)
      .sort({ fecha_respuesta: -1 })
      .lean()
      .exec(); 

    return {
      estado: 'exito',
      total_respuestas: estadisticas.length,
      datos: this.estadisticasService.formatearParaFrontend(estadisticas)
    };
  }

  async obtenerMetricasAnaliticas(procesoId: string, usuarioId: string, filtros: Record<string, string>, paginaFiltro?: number) {
    const queryMongo: Record<string, any> = { proceso_id: procesoId, usuario_id: usuarioId };

    const tipoFormulario = filtros['tipo'] || 'estudiantes';

    Object.entries(filtros)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([llaveFrontend, valor]) => {
        const campoMapeadoMongo = this.mapaFiltrosMongo[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor;
        }
      });

    const estadisticas = await this.estadisticaModelo
      .find(queryMongo)
      .select('constructos_paginas datos_respondente.genero -_id')
      .lean()
      .exec();

    const proceso = await this.formulariosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === 'estudiantes' ? proceso.formulario_estudiantes : proceso.formulario_socios;
    
    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const totalEsperados = configFormulario?.total_esperados || 0;

    return {
      status: 'exito',
      metricas: this.estadisticasService.calcularMetricasAnaliticas(estadisticas, nombresConstructos, totalEsperados, paginaFiltro)
    };
  }

  async sincronizarProcesoManual(procesoId: string, usuarioId: string) {
    const proceso = await this.formulariosService.obtenerProcesoInterno(usuarioId, procesoId);
    
    let totalGuardadas = 0;
    let mensajes: string [] = [];

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

  async obtenerOpcionesFiltrosDisponibles(procesoId: string, usuarioId: string, tipoFormulario: string = 'estudiantes') {

    const queryBase = { 
      proceso_id: procesoId, 
      usuario_id: usuarioId,
      tipo_formulario: tipoFormulario 
    };

    if (tipoFormulario === 'estudiantes') {
      const [carreras, sedes, generos, niveles] = await Promise.all([
        this.estadisticaModelo.distinct('datos_respondente.carrera', queryBase),
        this.estadisticaModelo.distinct('datos_respondente.sede', queryBase),
        this.estadisticaModelo.distinct('datos_respondente.genero', queryBase),
        this.estadisticaModelo.distinct('datos_respondente.nivel_formativo', queryBase)
      ]);

      return {
        estado: 'exito',
        filtros_disponibles: {
          carreras: carreras.filter(c => c !== 'No especificada'),
          sedes: sedes.filter(s => s !== 'No especificada'),
          generos: generos.filter(g => g !== 'No especificado'),
          niveles_formativos: niveles.filter(n => n !== 'No especificado')
        }
      };
    }

    if (tipoFormulario === 'socios') {
      const [organizaciones, generos] = await Promise.all([
        this.estadisticaModelo.distinct('datos_respondente.organizacion', queryBase),
        this.estadisticaModelo.distinct('datos_respondente.genero', queryBase)
      ]);

      return {
        estado: 'exito',
        filtros_disponibles: {
          organizaciones: organizaciones.filter(o => o !== 'No especificada'),
          generos: generos.filter(g => g !== 'No especificado')
        }
      };
    }
  }

  
  async obtenerComparativaGlobal(usuarioId: string, procesosIds: string[], tipoFormulario: string = 'estudiantes') {
    
    const comparativaCruda = await Promise.all(
      procesosIds.map(procesoId => this.procesarUnProcesoParaComparativa(usuarioId, procesoId, tipoFormulario))
    );

    comparativaCruda.sort((a, b) => a.anio - b.anio || a.nombre_proceso.localeCompare(b.nombre_proceso));

    const comparativaFinal = this.calcularVariacionesHistoricas(comparativaCruda);

    return {
      estado: 'exito',
      cantidad_procesos_comparados: comparativaFinal.length,
      comparativa_global: comparativaFinal
    };
  }

  private async procesarUnProcesoParaComparativa(usuarioId: string, procesoId: string, tipoFormulario: string) {
    const proceso = await this.formulariosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === 'estudiantes' ? proceso.formulario_estudiantes : proceso.formulario_socios;
    
    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const totalEsperados = configFormulario?.total_esperados || 0;

    const estadisticas = await this.estadisticaModelo.find({ 
      proceso_id: procesoId, 
      usuario_id: usuarioId, 
      tipo_formulario: tipoFormulario 
    })
    .select('constructos_paginas datos_respondente.genero -_id')
    .lean()
    .exec();

    const metricas = this.estadisticasService.calcularMetricasAnaliticas(estadisticas, nombresConstructos, totalEsperados);

    return {
      id_proceso: proceso._id.toString(),
      nombre_proceso: proceso.nombre_proceso,
      anio: proceso.anio,
      metricas: metricas
    };
  }
  private calcularVariacionesHistoricas(comparativaOrdenada: any[]) {
    return comparativaOrdenada.map((item, index) => {
      let variacionSatisfaccion : number | null = null; 
      let variacionesConstructos = [];

      if (index > 0) {
        const anterior = comparativaOrdenada[index - 1].metricas;
        const actual = item.metricas;

        if (anterior.promedio_satisfaccion_general > 0) {
          variacionSatisfaccion = Number((actual.promedio_satisfaccion_general - anterior.promedio_satisfaccion_general).toFixed(1));
        }

        variacionesConstructos = actual.promedios_por_pagina.map((constructoActual: any) => {
          const constructoAnterior = anterior.promedios_por_pagina.find(
            (c: any) => c.nombre_constructo === constructoActual.nombre_constructo
          );

          let variacion : number | null = null;
          if (constructoAnterior && constructoAnterior.promedio_constructo > 0) {
            variacion = Number((constructoActual.promedio_constructo - constructoAnterior.promedio_constructo).toFixed(1));
          }

          return {
            nombre_constructo: constructoActual.nombre_constructo,
            promedio_actual: constructoActual.promedio_constructo,
            variacion_respecto_anterior: variacion 
          };
        });
      }

      return {
        ...item,
        variacion_satisfaccion_respecto_anterior: variacionSatisfaccion,
        variaciones_constructos: variacionesConstructos 
      };
    });
  }

  async generarVolumenDummy(procesoId: string, usuarioId: string, cantidad: number) {
    const respuestaBase = await this.estadisticaModelo.findOne({ proceso_id: procesoId }).lean().exec();

    if (!respuestaBase) {
      throw new BadRequestException('Debes tener al menos 1 respuesta real en este proceso para poder clonarla.');
    }

    const carreras = ['Ingeniería Comercial', 'Medicina', 'Derecho', 'Arquitectura', 'Psicología'];
    const generos = ['Masculino', 'Femenino', 'Prefiero no decirlo'];
    const sedes = ['Antofagasta', 'Coquimbo'];

    let creados = 0;

    for (let i = 0; i < cantidad; i++) 
    {
      const clon = JSON.parse(JSON.stringify(respuestaBase));

      delete clon._id;
      delete clon.__v;

      clon.id_respuesta_google = `dummy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      clon.fecha_respuesta = new Date(Date.now() - Math.floor(Math.random() * 2592000000)); 

      clon.datos_respondente.carrera = carreras[Math.floor(Math.random() * carreras.length)];
      clon.datos_respondente.genero = generos[Math.floor(Math.random() * generos.length)];
      clon.datos_respondente.sede = sedes[Math.floor(Math.random() * sedes.length)];

      (clon.constructos_paginas || []).forEach((pagina: any) => 
      {
        (pagina.preguestas_pagina || []).forEach((preg: any) => {
          preg.valor_numerico = Math.floor(Math.random() * 5) + 1;
          preg.respuesta_texto = `Opción generada aleatoriamente (${preg.valor_numerico})`;
        });
      });

      await new this.estadisticaModelo(clon).save();
      creados++;
    }

    return { 
      estado: 'exito', 
      mensaje: `¡Se generaron ${creados} respuestas falsas exitosamente! Ya puedes ver tu dashboard.` 
    };
  }

}