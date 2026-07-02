import { Injectable } from '@nestjs/common';
import { TipoFormulario } from '../../common/enum/tipo-formulario.enum';
import { EstadisticasRepository } from '../estadisticas.repository';
import { ProcesosService } from 'src/formularios/services/procesos.service';
import { EstadisticasAnaliticasService } from './estadisticas-analiticas.service';
import { ProcesoComparativa, VariacionConstructo } from '../interfaces/proceso-comparativo.interface';
import { MetricaConstructo } from '../interfaces/metrica-constructo.interface';
import { ResultadoCronbach } from '../interfaces/resultado-cronbach.interface';
import { BadRequestException } from '@nestjs/common';
import { MAPA_FILTROS_MONGO } from '../constantes/filtros-mongo.constant';

@Injectable()
export class EstadisticasComparativasService {
  constructor(
    private readonly repositorio: EstadisticasRepository,
    private readonly procesosService: ProcesosService,
    private readonly analiticasService: EstadisticasAnaliticasService
  ) {}

  async obtenerComparativaGlobal(usuarioId: string, procesosIds: string[], tipoFormulario: TipoFormulario = TipoFormulario.ESTUDIANTES) {
    const comparativaCruda = await Promise.all(
      procesosIds.map(procesoId => this.procesarUnProcesoParaComparativa(usuarioId, procesoId, tipoFormulario))
    );

    comparativaCruda.sort((a, b) => a.anio - b.anio || a.nombre_proceso.localeCompare(b.nombre_proceso));
    
    const comparativaFinal = this.calcularVariacionesHistoricas(comparativaCruda);
    const comparativaAlfas = this.calcularPromediosAlfasComparativos(comparativaCruda);
    const comparativaPromedios = this.calcularPromediosPreguntasComparativos(comparativaCruda);

    return {
      estado: 'exito',
      cantidad_procesos_comparados: comparativaFinal.length,
      comparativa_global: comparativaFinal,
      comparativa_alfas: comparativaAlfas,
      comparativa_promedios: comparativaPromedios
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
      let variacionesConstructos: VariacionConstructo[] = [];

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

  private calcularPromediosAlfasComparativos(comparativaOrdenada: ProcesoComparativa[]) {
    type DetalleAlfa = { nombre_proceso: string; alfa: number };
    type ConstructoAgrupado = {
      nombre_constructo: string;
      alfas_globales: DetalleAlfa[];
      mapa_preguntas: Map<string, DetalleAlfa[]>;
    };

    const mapaConstructos = new Map<string, ConstructoAgrupado>();

    comparativaOrdenada.forEach(proceso => {
      const nombreProc = proceso.nombre_proceso;
      const fiabilidad = proceso.metricas.fiabilidad_constructos || [];

      fiabilidad.forEach((f: ResultadoCronbach) => {
        const nombreConst = f.nombre_constructo;
        if (!mapaConstructos.has(nombreConst)) {
          mapaConstructos.set(nombreConst, { nombre_constructo: nombreConst, alfas_globales: [], mapa_preguntas: new Map() });
        }
        const constructoData = mapaConstructos.get(nombreConst)!;
        constructoData.alfas_globales.push({ nombre_proceso: nombreProc, alfa: f.alfa_cronbach_global });

        if (f.alfa_si_se_elimina_pregunta) {
          Object.entries(f.alfa_si_se_elimina_pregunta).forEach(([pregunta, alfa]) => {
            if (!constructoData.mapa_preguntas.has(pregunta)) constructoData.mapa_preguntas.set(pregunta, []);
            constructoData.mapa_preguntas.get(pregunta)!.push({ nombre_proceso: nombreProc, alfa: Number(alfa) });
          });
        }
      });
    });

    return Array.from(mapaConstructos.values()).map(c => {
      const promedioGlobal = c.alfas_globales.length > 0 
        ? Number((c.alfas_globales.reduce((sum, item) => sum + item.alfa, 0) / c.alfas_globales.length).toFixed(3)) : 0;

      const preguntasFinales = Array.from(c.mapa_preguntas.entries()).map(([pregunta, alfasArray]) => ({
        pregunta,
        detalle_procesos: alfasArray,
        promedio_alfa_pregunta: alfasArray.length > 0 ? Number((alfasArray.reduce((sum, item) => sum + item.alfa, 0) / alfasArray.length).toFixed(3)) : 0
      }));

      return { nombre_constructo: c.nombre_constructo, detalle_procesos: c.alfas_globales, promedio_alfa_constructo: promedioGlobal, preguntas: preguntasFinales };
    });
  }

  private calcularPromediosPreguntasComparativos(comparativaOrdenada: any[]) {
    type DetallePromedio = { nombre_proceso: string; promedio: number };
    type ConstructoAgrupado = {
      nombre_constructo: string;
      promedios_globales: DetallePromedio[];
      mapa_preguntas: Map<string, DetallePromedio[]>;
    };

    const mapaConstructos = new Map<string, ConstructoAgrupado>();

    comparativaOrdenada.forEach(proceso => {
      const nombreProc = proceso.nombre_proceso;
      const metricas = proceso.metricas;

      const promediosPagina = metricas.promedios_por_pagina || [];
      promediosPagina.forEach((p: any) => {
        const nombreConst = p.nombre_constructo;
        if (!mapaConstructos.has(nombreConst)) {
          mapaConstructos.set(nombreConst, { nombre_constructo: nombreConst, promedios_globales: [], mapa_preguntas: new Map() });
        }
        mapaConstructos.get(nombreConst)!.promedios_globales.push({ nombre_proceso: nombreProc, promedio: p.promedio_constructo });
      });

      const detalleDimension = metricas.detalle_por_dimension || [];
      detalleDimension.forEach((dim: any) => {
        const nombreConst = dim.nombre_constructo;
        if (!mapaConstructos.has(nombreConst)) {
          mapaConstructos.set(nombreConst, { nombre_constructo: nombreConst, promedios_globales: [], mapa_preguntas: new Map() });
        }
        const constructoData = mapaConstructos.get(nombreConst)!;

        (dim.preguntas || []).forEach((preg: any) => {
          if (!constructoData.mapa_preguntas.has(preg.pregunta)) {
            constructoData.mapa_preguntas.set(preg.pregunta, []);
          }
          constructoData.mapa_preguntas.get(preg.pregunta)!.push({ nombre_proceso: nombreProc, promedio: preg.promedio });
        });
      });
    });

    return Array.from(mapaConstructos.values()).map(c => {
      const promedioGeneralConstructo = c.promedios_globales.length > 0 
        ? Number((c.promedios_globales.reduce((sum, item) => sum + item.promedio, 0) / c.promedios_globales.length).toFixed(1)) : 0;

      const preguntasFinales = Array.from(c.mapa_preguntas.entries()).map(([pregunta, promediosArray]) => ({
        pregunta,
        detalle_procesos: promediosArray,
        promedio_general_pregunta: promediosArray.length > 0 
          ? Number((promediosArray.reduce((sum, item) => sum + item.promedio, 0) / promediosArray.length).toFixed(1)) : 0
      }));

      return { 
        nombre_constructo: c.nombre_constructo, 
        promedio_general_constructo: promedioGeneralConstructo, 
        detalle_procesos: c.promedios_globales, 
        preguntas: preguntasFinales 
      };
    });
  }

  async obtenerComparativaInterna(
    usuarioId: string, 
    procesoId: string, 
    agruparPor: string, 
    tipoFormulario: TipoFormulario = TipoFormulario.ESTUDIANTES,
    valoresFiltro?: string[],
    filtrosAdicionales: Record<string, string> = {}
  ) {
    const campoMapeadoMongo = MAPA_FILTROS_MONGO[agruparPor];
    if (!campoMapeadoMongo) {
      throw new BadRequestException(`No se puede agrupar por el campo: ${agruparPor}`);
    }

    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;
    const nombresConstructos = configFormulario?.nombres_constructos || [];

    const queryBase: Record<string, unknown> = { proceso_id: procesoId, usuario_id: usuarioId, tipo_formulario: tipoFormulario };

    Object.entries(filtrosAdicionales)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([llaveFrontend, valor]) => {
        const campoMongo = MAPA_FILTROS_MONGO[llaveFrontend];
        if (campoMongo) {
          queryBase[campoMongo] = valor;
        }
      });

    const opcionesCrudas = await this.repositorio.obtenerOpcionesDistintas(campoMapeadoMongo, queryBase);
    
    let gruposValidos = opcionesCrudas.filter(o => o && o !== 'No especificada' && o !== 'No especificado');

    if (valoresFiltro && valoresFiltro.length > 0) {
      gruposValidos = gruposValidos.filter(g => valoresFiltro.includes(String(g)));
    }

    if (gruposValidos.length === 0) {
      return { estado: 'exito', agrupado_por: agruparPor, cantidad_procesos_comparados: 0, comparativa_global: [], comparativa_alfas: [], comparativa_promedios: [] };
    }

    const comparativaCruda: ProcesoComparativa[] = await Promise.all(
      gruposValidos.map(async (nombreGrupo, index) => {
        const queryGrupo = { ...queryBase, [campoMapeadoMongo]: nombreGrupo }; 
        
        const estadisticasGrupo = await this.repositorio.buscarPorQuery(queryGrupo, 'constructos_paginas datos_respondente -_id');
        
        const metricas = this.analiticasService.calcularMetricasAnaliticas(estadisticasGrupo, nombresConstructos, 0);

        return {
          id_proceso: `${procesoId}-grupo-${index}`,
          nombre_proceso: String(nombreGrupo), 
          anio: proceso.anio,
          metricas: metricas as any
        };
      })
    );

    comparativaCruda.sort((a, b) => b.metricas.promedio_satisfaccion_general - a.metricas.promedio_satisfaccion_general);

    const comparativaFinal = comparativaCruda.map(item => ({
      ...item,
      variacion_satisfaccion_respecto_anterior: null,
      variaciones_constructos: item.metricas.promedios_por_pagina.map((c: MetricaConstructo) => ({
         nombre_constructo: c.nombre_constructo,
         promedio_actual: c.promedio_constructo,
         variacion_respecto_anterior: null
      }))
    }));
    const comparativaAlfas = this.calcularPromediosAlfasComparativos(comparativaCruda);
    const comparativaPromedios = this.calcularPromediosPreguntasComparativos(comparativaCruda);

    return {
      estado: 'exito',
      agrupado_por: agruparPor,
      cantidad_procesos_comparados: comparativaFinal.length,
      comparativa_global: comparativaFinal, 
      comparativa_alfas: comparativaAlfas,
      comparativa_promedios: comparativaPromedios
    };
  }

}