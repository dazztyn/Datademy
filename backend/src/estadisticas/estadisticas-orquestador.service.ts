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

  private readonly mapaFiltrosMongo: Record<string, string> = {
    tipo: 'tipo_formulario',
    carrera: 'datos_respondente.carrera',
    genero: 'datos_respondente.genero',
    sede: 'datos_respondente.sede',
    nivel_formativo: 'datos_respondente.nivel_formativo'
  };

  async obtenerResultadosTabulares(procesoId: string, usuarioId: string, filtros: Record<string, string>) {
    // 1. Inicializamos la consulta con las condiciones obligatorias de seguridad
    const queryMongo: Record<string, any> = { proceso_id: procesoId, usuario_id: usuarioId };

    // 2. CONSTRUCCIÓN DINÁMICA DE FILTROS SIMULTÁNEOS
    Object.entries(filtros)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '') // Limpiamos filtros vacíos
      .forEach(([llaveFrontend, valor]) => {
        const campoMapeadoMongo = this.mapaFiltrosMongo[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor; // Agrega filtros concurrentes al objeto (Operación AND implícita en Mongo)
        }
      });

    // 3. Ejecutamos la consulta multi-filtro optimizada
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

  /**
   * Obtiene y computa las métricas analíticas aplicando filtros concurrentes.
   */
  async obtenerMetricasAnaliticas(procesoId: string, usuarioId: string, filtros: Record<string, string>, paginaFiltro?: number) {
    const queryMongo: Record<string, any> = { proceso_id: procesoId, usuario_id: usuarioId };

    // Sigue aplicando filtros concurrentes de base de datos (tipo, carrera, genero, sede)
    Object.entries(filtros)
      .filter(([_, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([llaveFrontend, valor]) => {
        const campoMapeadoMongo = this.mapaFiltrosMongo[llaveFrontend];
        if (campoMapeadoMongo) {
          queryMongo[campoMapeadoMongo] = valor;
        }
      });

    const estadisticas = await this.estadisticaModelo.find(queryMongo).lean().exec();

    // Enviamos los documentos y el filtro de página opcional al motor matemático
    return {
      status: 'exito',
      metricas: this.estadisticasService.calcularMetricasAnaliticas(estadisticas, paginaFiltro)
    };
  }

  /**
   * Sincroniza manualmente todas las respuestas de un proceso (Estudiantes y Socios).
   * Ideal para formularios importados o si el webhook caducó.
   */
  async sincronizarProcesoManual(procesoId: string, usuarioId: string) {
    const proceso = await this.formulariosService.obtenerProcesoInterno(usuarioId, procesoId);
    
    let totalGuardadas = 0;
    let mensajes: string [] = [];

    // 1. Sincronizamos a los estudiantes (si existe el formulario)
    if (proceso.formulario_estudiantes?.id_google_form) {
      const resultadoEstudiantes = await this.manejarNuevoWebhookGoogle(proceso.formulario_estudiantes.id_google_form);
      totalGuardadas += resultadoEstudiantes.guardadas;
      mensajes.push(`Estudiantes: ${resultadoEstudiantes.guardadas} respuestas nuevas.`);
    }

    // 2. Sincronizamos a los socios (si existe el formulario)
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

  /**
   * Explora la base de datos y devuelve los valores únicos reales 
   * dependiendo de si se piden filtros para estudiantes o para socios.
   */
  async obtenerOpcionesFiltrosDisponibles(procesoId: string, usuarioId: string, tipoFormulario: string = 'estudiantes') {

    const queryBase = { 
      proceso_id: procesoId, 
      usuario_id: usuarioId,
      tipo_formulario: tipoFormulario // Solo busca en los de este tipo específico
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
      return {
        estado: 'exito',
        filtros_disponibles: {
          // Aquí después usaremos .distinct() para extraer el Nombre de la Empresa, etc.
        }
      };
    }

    return { estado: 'error', mensaje: 'Tipo de formulario no válido' };
  }

}