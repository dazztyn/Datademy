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
    const tipoFormulario = filtros['tipo'] as TipoFormulario || TipoFormulario.ESTUDIANTES;

    const queryMongo = await this.construirQueryConPodaInteligente(procesoId, usuarioId, tipoFormulario, filtros);

    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;
    
    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const totalEsperados = configFormulario?.total_esperados || 0;
    const escalaSatisfaccion = configFormulario?.escala_satisfaccion || 7;
    const escalaLikert = configFormulario?.escala_likert || 4;
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
        npsMongo,
        escalaSatisfaccion,
        escalaLikert
      )
    };
  }

  async obtenerOpcionesFiltrosDisponibles(procesoId: string, usuarioId: string, tipoFormulario: string = 'estudiantes') {
    const queryBase: Record<string, string | number | boolean | Record<string, unknown>> = { 
      proceso_id: procesoId, 
      usuario_id: usuarioId, 
      tipo_formulario: tipoFormulario 
    };

    const proceso = await this.procesosService.obtenerProcesoInterno(usuarioId, procesoId);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;

    const nombresConstructos = configFormulario?.nombres_constructos || [];
    const constructosConId = nombresConstructos.map((nombre, index) => ({ id: index + 2, nombre }));

    const filtros_disponibles: Record<string, unknown> = {
      nombres_constructos: constructosConId
    };

    const mapeoPlurales: Record<string, string> = {
      carrera: 'Carreras',
      sede: 'Sedes',
      genero: 'Géneros',
      nivel_formativo: 'Niveles formativos',
      asignatura: 'Asignaturas',
      organizacion: 'Organizaciones'
    };

    const promesas = Object.entries(MAPA_FILTROS_MONGO)
      .filter(([llaveSingular]) => llaveSingular !== 'tipo')
      .map(async ([llaveSingular, campoMongo]) => {
        const opciones = await this.repositorio.obtenerOpcionesDistintas(campoMongo, queryBase);
        const opcionesLimpias = opciones.filter(op => op && op !== 'No especificada' && op !== 'No especificado');
        
        if (opcionesLimpias.length > 0) {
          /* istanbul ignore next */
          const llavePlural = mapeoPlurales[llaveSingular] || llaveSingular;
          filtros_disponibles[llavePlural] = opcionesLimpias;
        }
      });

    await Promise.all(promesas);

    return { estado: 'exito', filtros_disponibles };
  }

  private async construirQueryConPodaInteligente(
    procesoId: string, 
    usuarioId: string, 
    tipoFormulario: TipoFormulario, 
    filtrosCrudos: Record<string, string>
  ): Promise<Record<string, unknown>> {
    const queryMongo: Record<string, unknown> = { 
      proceso_id: procesoId, 
      usuario_id: usuarioId, 
      tipo_formulario: tipoFormulario 
    };

    const entradasFiltros = Object.entries(filtrosCrudos).filter(([llave, valor]) => 
      valor !== undefined && valor !== null && valor !== '' && llave !== 'tipo' && llave !== 'pagina'
    );

    await Promise.all(entradasFiltros.map(async ([llaveFrontend, valor]) => {
      const campoMapeadoMongo = MAPA_FILTROS_MONGO[llaveFrontend];
      
      if (campoMapeadoMongo) {
        const opcionesCrudas = await this.repositorio.obtenerOpcionesDistintas(campoMapeadoMongo, {
          proceso_id: procesoId,
          usuario_id: usuarioId,
          tipo_formulario: tipoFormulario
        });
        
        const esCampoActivo = opcionesCrudas.some(op => 
          op && op !== 'No especificada' && op !== 'No especificado' && op !== 'Sin respuesta'
        );

        if (esCampoActivo) {
          queryMongo[campoMapeadoMongo] = valor;
        }
      }
    }));

    return queryMongo;
  }

}