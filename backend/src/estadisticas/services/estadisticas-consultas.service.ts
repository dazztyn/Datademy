import { Injectable } from '@nestjs/common';
import { EstadisticasAnaliticasService } from './estadisticas-analiticas.service';
import { EstadisticasFormatterService } from './estadisticas-formatter.service';
import { TipoFormulario } from '../../common/enum/tipo-formulario.enum';
import { EstadisticasRepository } from '../estadisticas.repository';
import { ProcesosService } from 'src/formularios/services/procesos.service';
import { MAPA_FILTROS_MONGO } from '../constantes/filtros-mongo.constant';

@Injectable()
export class EstadisticasConsultasService {

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
        const campoMapeadoMongo = MAPA_FILTROS_MONGO[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor; 
        }
      });

    const estadisticas = await this.repositorio.buscarPorQuery(queryMongo, '', { fecha_respuesta: -1 }, 1000);

    return {
      estado: 'exito',
      total_respuestas: estadisticas.length,
      datos: this.formatterService.formatearParaFrontend(estadisticas)
    };
  }

  async obtenerMetricasAnaliticas(procesoId: string, usuarioId: string, filtros: Record<string, string>, paginaFiltro?: number) {
    const queryMongo: Record<string, unknown> = { proceso_id: procesoId, usuario_id: usuarioId };
    const tipoFormulario = filtros['tipo'] as TipoFormulario || TipoFormulario.ESTUDIANTES;

    Object.entries(filtros)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([llaveFrontend, valor]) => {
        const campoMapeadoMongo = MAPA_FILTROS_MONGO[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor;
        }
      }
    );

    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;
    
    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const totalEsperados = configFormulario?.total_esperados || 0;
    const ultimaPagina = nombresConstructos.length + 2;

    const [
      promediosCrudosMongo,
      demograficosMongo,
      npsMongo,
      estadisticas
    ] = await Promise.all([
      this.repositorio.calcularPromediosAgrupadosPorPagina(queryMongo),
      this.repositorio.calcularDistribucionGeneroMongo(queryMongo),
      this.repositorio.calcularNpsMongo(queryMongo, ultimaPagina),
      this.repositorio.buscarPorQuery(queryMongo, 'constructos_paginas datos_respondente -_id')
    ]);

    return {
      status: 'exito',
      metricas: this.analiticasService.calcularMetricasAnaliticas(
        estadisticas, 
        nombresConstructos, 
        totalEsperados, 
        paginaFiltro, 
        promediosCrudosMongo,
        demograficosMongo, 
        npsMongo
      )
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
}