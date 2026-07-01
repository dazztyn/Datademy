import { Injectable } from '@nestjs/common';
import { TipoFormulario } from '../../common/enum/tipo-formulario.enum';
import { EstadisticasRepository } from '../estadisticas.repository';
import { ProcesosService } from 'src/formularios/services/procesos.service';
import { EstadisticasAnaliticasService } from './estadisticas-analiticas.service';
import { ProcesoComparativa, VariacionConstructo } from '../interfaces/proceso-comparativo.interface';
import { MetricaConstructo } from '../interfaces/metrica-constructo.interface';
import { ResultadoCronbach } from '../interfaces/resultado-cronbach.interface';

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

    return {
      estado: 'exito',
      cantidad_procesos_comparados: comparativaFinal.length,
      comparativa_global: comparativaFinal,
      comparativa_alfas: comparativaAlfas
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
}