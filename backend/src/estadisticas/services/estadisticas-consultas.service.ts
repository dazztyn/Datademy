import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EstadisticasAnaliticasService } from './estadisticas-analiticas.service';
import { EstadisticasFormatterService } from './estadisticas-formatter.service';
import { ProcesoComparativa } from '../interfaces/proceso-comparativo.interface';
import { MetricaConstructo } from '../interfaces/metrica-constructo.interface';
import { TipoFormulario } from '../../common/enum/tipo-formulario.enum';
import { EstadisticasRepository } from '../estadisticas.repository';
import { ProcesosService } from 'src/formularios/services/procesos.service';

@Injectable()
export class EstadisticasConsultasService {
  private readonly mapaFiltrosMongo: Record<string, string> = {
    tipo: 'tipo_formulario',
    carrera: 'datos_respondente.carrera',
    genero: 'datos_respondente.genero',
    sede: 'datos_respondente.sede',
    nivel_formativo: 'datos_respondente.nivel_formativo',
    organizacion: 'datos_respondente.organizacion',
    asignatura: 'datos_respondente.asignatura'
  };

  constructor(
    private readonly analiticasService: EstadisticasAnaliticasService,
    private readonly formatterService: EstadisticasFormatterService,
    private readonly repositorio: EstadisticasRepository,
    private readonly procesosService: ProcesosService
  ) {}

  async obtenerResultadosTabulares(procesoId: string, usuarioId: string, filtros: Record<string, string>) {
    const queryMongo: Record<string, string | number | boolean | Record<string, unknown>> = { proceso_id: procesoId, usuario_id: usuarioId };

    Object.entries(filtros)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '') 
      .forEach(([llaveFrontend, valor]) => {
        const campoMapeadoMongo = this.mapaFiltrosMongo[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor; 
        }
      });

    const estadisticas = await this.repositorio.buscarPorQuery(queryMongo, '', { fecha_respuesta: -1 });

    return {
      estado: 'exito',
      total_respuestas: estadisticas.length,
      datos: this.formatterService.formatearParaFrontend(estadisticas)
    };
  }

  async obtenerMetricasAnaliticas(procesoId: string, usuarioId: string, filtros: Record<string, string>, paginaFiltro?: number) {
    const queryMongo: Record<string, string | number | boolean | Record<string, unknown>> = { proceso_id: procesoId, usuario_id: usuarioId };
    const tipoFormulario = filtros['tipo'] as TipoFormulario || TipoFormulario.ESTUDIANTES;

    Object.entries(filtros)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([llaveFrontend, valor]) => {
        const campoMapeadoMongo = this.mapaFiltrosMongo[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor;
        }
      });
    const estadisticas = await this.repositorio.buscarPorQuery(queryMongo, 'constructos_paginas datos_respondente -_id'); 

    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;
    
    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const totalEsperados = configFormulario?.total_esperados || 0;

    return {
      status: 'exito',
      metricas: this.analiticasService.calcularMetricasAnaliticas(estadisticas, nombresConstructos, totalEsperados, paginaFiltro)
    };
  }

  async obtenerOpcionesFiltrosDisponibles(procesoId: string, usuarioId: string, tipoFormulario: string = 'estudiantes') {
    const queryBase: Record<string, string | number | boolean | Record<string, unknown>> = { proceso_id: procesoId, usuario_id: usuarioId, tipo_formulario: tipoFormulario };

    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;
    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const constructosConId = nombresConstructos.map((nombre, index) => ({
      id: index + 2,
      nombre: nombre
    }));

    if (tipoFormulario === TipoFormulario.ESTUDIANTES) {
      const [carreras, sedes, generos, niveles, asignaturas] = await Promise.all([
        this.repositorio.obtenerOpcionesDistintas('datos_respondente.carrera', queryBase),
        this.repositorio.obtenerOpcionesDistintas('datos_respondente.sede', queryBase),
        this.repositorio.obtenerOpcionesDistintas('datos_respondente.genero', queryBase),
        this.repositorio.obtenerOpcionesDistintas('datos_respondente.nivel_formativo', queryBase),
        this.repositorio.obtenerOpcionesDistintas('datos_respondente.asignatura', queryBase)
      ]);

      return {
        estado: 'exito',
        filtros_disponibles: {
          carreras: carreras.filter(c => c !== 'No especificada'),
          sedes: sedes.filter(s => s !== 'No especificada'),
          generos: generos.filter(g => g !== 'No especificado'),
          niveles_formativos: niveles.filter(n => n !== 'No especificado'),
          asignaturas: asignaturas.filter(a => a !== 'No especificada'),
          nombres_constructos: constructosConId
        }
      };
    }

    if (tipoFormulario === TipoFormulario.SOCIOS) {
      const [organizaciones, generos] = await Promise.all([
        this.repositorio.obtenerOpcionesDistintas('datos_respondente.organizacion', queryBase),
        this.repositorio.obtenerOpcionesDistintas('datos_respondente.genero', queryBase)
      ]);

      return {
        estado: 'exito',
        filtros_disponibles: {
          organizaciones: organizaciones.filter(o => o !== 'No especificada'),
          generos: generos.filter(g => g !== 'No especificado'),
          nombres_constructos: constructosConId
        }
      };
    }
  }

  async obtenerComparativaGlobal(usuarioId: string, procesosIds: string[], tipoFormulario: TipoFormulario = TipoFormulario.ESTUDIANTES) {
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
  
  private async procesarUnProcesoParaComparativa(usuarioId: string, procesoId: string, tipoFormulario: TipoFormulario) {
    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;
    
    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const totalEsperados = configFormulario?.total_esperados || 0;

    const estadisticas = await this.repositorio.buscarPorQuery(
      { proceso_id: procesoId, usuario_id: usuarioId, tipo_formulario: tipoFormulario },
      'constructos_paginas datos_respondente.genero -_id'
    );

    const metricas = this.analiticasService.calcularMetricasAnaliticas(estadisticas, nombresConstructos, totalEsperados);

    return {
      id_proceso: proceso._id.toString(),
      nombre_proceso: proceso.nombre_proceso,
      anio: proceso.anio,
      metricas: metricas
    };
  }

  private calcularVariacionesHistoricas(comparativaOrdenada: ProcesoComparativa[]) {
    return comparativaOrdenada.map((item, index) => {
      let variacionSatisfaccion: number | null = null; 
      
      let variacionesConstructos: 
      {
        nombre_constructo: string;
        promedio_actual: number;
        variacion_respecto_anterior: number | null;
      }[] = [];

      if (index > 0) {
        const anterior = comparativaOrdenada[index - 1].metricas;
        const actual = item.metricas;

        if (anterior.promedio_satisfaccion_general > 0) {
          variacionSatisfaccion = Number((actual.promedio_satisfaccion_general - anterior.promedio_satisfaccion_general).toFixed(1));
        }

        variacionesConstructos = actual.promedios_por_pagina.map((constructoActual: MetricaConstructo) => {
          const constructoAnterior = anterior.promedios_por_pagina.find(
            (c: MetricaConstructo) => c.nombre_constructo === constructoActual.nombre_constructo
          );

          let variacion: number | null = null;
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

  @OnEvent('proceso.eliminado')
  async limpiarDatosHuerfanos(procesoId: string): Promise<void> {
    console.log(`[Eventos] Escuché que se borró el proceso ${procesoId}. Limpiando estadísticas...`);
    await this.repositorio.eliminarRespuestasPorProceso(procesoId);
  }
  
  @OnEvent('formulario.desasignado')
  async limpiarEstadisticasHuerfanas(payload: { procesoId: string, tipoFormulario: string }) {
    console.log(`[Event Bus] Limpiando estadísticas del formulario ${payload.tipoFormulario} desasignado...`);
    await this.repositorio.eliminarEstadisticasPorFiltro({
      proceso_id: payload.procesoId,
      tipo_formulario: payload.tipoFormulario
    });
  }
}