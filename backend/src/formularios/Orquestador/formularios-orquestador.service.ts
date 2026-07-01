
import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';
import { ProcesosService } from '../services/procesos.service';
import { PlantillasService } from '../services/plantillas.service';
import { ConfiguracionesService } from '../services/configuraciones.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import type { ProcesoDocument } from '../schemas/proceso.schema';
import { GoogleDriveService } from 'src/google/services/google-drive.service';
import { GoogleFormsService } from 'src/google/services/google-forms.service';
import { generarUrlsGoogleForm } from 'src/common/utils/google-urls.util';


@Injectable()
export class FormulariosOrquestadorService {
  constructor(
    private readonly procesosService: ProcesosService,
    private readonly plantillasService: PlantillasService,
    private readonly configuracionesService: ConfiguracionesService,
    private readonly googleDriveService: GoogleDriveService, 
    private readonly googleFormsService: GoogleFormsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async crearYVincularFormulario(
    usuario_id: string,
    idProceso: string,
    idPlantilla: string,
    nombreNuevoFormulario: string,
    tipoFormulario: TipoFormulario
  ) 
  {

    const idCarpetaDestino = await this.configuracionesService.obtenerCarpetaDestino(usuario_id);
    const resultadoCopia = await this.googleDriveService.copiarPlantillaYGuardar(
      idPlantilla,
      nombreNuevoFormulario,
      idCarpetaDestino
    );

    const nuevoFormId = resultadoCopia.nuevo_id_google_form;

    if (!nuevoFormId) 
    {
      throw new InternalServerErrorException('Error crítico: Google Drive no retornó un ID válido al clonar el formulario.');
    }

    await this.googleFormsService.activarVigilanciaRespuestas(nuevoFormId);

    const urlsGoogle = generarUrlsGoogleForm(nuevoFormId);

    const campoBase = `formulario_${tipoFormulario}`; 
    const datosAActualizar = {
      [campoBase]: {
        id_google_form: nuevoFormId,
        nombre_formulario: nombreNuevoFormulario, 
        id_carpeta_drive: idCarpetaDestino, 
        url_edicion:  urlsGoogle.urlEdicion,
        url_respuesta: urlsGoogle.urlRespuesta,
        nombres_constructos: [],
        total_esperados: 0
      }
    };

    const resultadoActualizacion = await this.procesosService.actualizar(usuario_id, idProceso, datosAActualizar);

    return {
      estado: 'exito',
      idFormulario: nuevoFormId,
      nombreFormulario: nombreNuevoFormulario,
      idCarpetaDrive: idCarpetaDestino,
      urlEdicion: urlsGoogle.urlEdicion,
      urlRespuesta: urlsGoogle.urlRespuesta,
      datosActualizados: resultadoActualizacion.datos
    };
  }

  async sincronizarCarpetaPlantillas(usuario_id: string, idCarpeta: string) 
  {
    try 
    {
      const archivosEnDrive = await this.googleDriveService.listarPlantillas(idCarpeta);

      const plantillasGuardadas = await this.plantillasService.guardarPlantillasEnCache(usuario_id, archivosEnDrive);

      return {
        estado: 'exito',
        mensaje: `Se sincronizaron ${plantillasGuardadas.length} plantillas exitosamente.`,
        datos: plantillasGuardadas
      };
    } catch (error) {
      console.error("Error en orquestador al sincronizar:", error);
      throw new Error("No se pudo sincronizar las plantillas con Google Drive.");
    }
  }

  async eliminarProcesoCompleto(usuario_id: string, idProceso: string) 
  {
    await this.procesosService.actualizar(usuario_id, idProceso, { estado: 'borrado_pendiente' });
    const proceso = await this.procesosService.obtenerProcesoInterno(usuario_id, idProceso);
    this.eventEmitter.emit('proceso.iniciar_destruccion', proceso);
    return { 
      estado: 'exito', 
      mensaje: 'El proceso se ha ocultado y se está eliminando de forma segura en segundo plano.',
      idProceso: idProceso
    };
  }
  
  async vincularFormularioExistente(
    usuario_id: string,
    idProceso: string,
    idFormularioExistente: string,
    tipoFormulario: TipoFormulario
  ) {
    try {
      const diseno = await this.googleFormsService.obtenerDisenoFormulario(idFormularioExistente);
      const nombreFormulario = diseno.info?.title || 'Formulario Importado';
      await this.googleFormsService.activarVigilanciaRespuestas(idFormularioExistente);
      const urlsGoogle = generarUrlsGoogleForm(idFormularioExistente);
      const campoBase = `formulario_${tipoFormulario}`;
      const datosAActualizar = {
      [campoBase]: {
        id_google_form: idFormularioExistente,
        nombre_formulario: nombreFormulario, 
        id_carpeta_drive: 'exportado_externamente',
        url_edicion: urlsGoogle.urlEdicion,
        url_respuesta: urlsGoogle.urlRespuesta,
        nombres_constructos: [],
        total_esperados: 0
      }
    };

      const resultadoActualizacion = await this.procesosService.actualizar(usuario_id, idProceso, datosAActualizar);

      return {
        estado: 'exito',
        mensaje: 'Formulario existente vinculado y bajo vigilancia',
        idFormulario: idFormularioExistente,
        nombreFormulario: nombreFormulario,
        urlEdicion: urlsGoogle.urlEdicion,
        urlRespuesta: urlsGoogle.urlRespuesta,
        datosActualizados: resultadoActualizacion.datos
      };
    } catch (error) {
      console.error('Error al vincular formulario existente:', error);
      throw new InternalServerErrorException('No se pudo vincular el formulario. Verifique que el ID sea correcto y tenga permisos.');
    }
  }

  async obtenerCantidadConstructos(usuario_id: string, idProceso: string, tipoFormulario: TipoFormulario) 
  {
    const proceso = await this.procesosService.obtenerProcesoInterno(usuario_id, idProceso);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;

    if (!configFormulario || !configFormulario.id_google_form) {
      throw new BadRequestException(`El formulario de ${tipoFormulario} aún no ha sido vinculado a este proceso.`);
    }

    const diseno = await this.googleFormsService.obtenerDisenoFormulario(configFormulario.id_google_form);

    let cantidadPaginas = 1;
    if (diseno.items) {
      diseno.items.forEach(item => {
        if (item.pageBreakItem) cantidadPaginas++;
      });
    }

    let cantidadConstructos = cantidadPaginas - 2;
    if (cantidadConstructos < 0) cantidadConstructos = 0;

    return {
      estado: 'exito',
      cantidad_paginas_total: cantidadPaginas,
      cantidad_constructos: cantidadConstructos
    };
  }

  async eliminarInformeCompleto(usuario_id: string, idProceso: string, idInformeDrive: string) 
  {
    await this.googleDriveService.eliminarArchivoDrive(idInformeDrive);    
    await this.procesosService.eliminarInformeDeProceso(usuario_id, idProceso, idInformeDrive);
    
    return {
      estado: 'exito',
      mensaje: 'Informe eliminado correctamente de Google Drive y del sistema.',
      idEliminado: idInformeDrive
    };
  }

  @OnEvent('proceso.iniciar_destruccion')
  async ejecutarDestruccionEnSegundoPlano(proceso: ProcesoDocument) {
    console.log(`[Background] Iniciando destrucción total del proceso ${proceso._id}...`);
    
    try {
      const idProcesoStr = String(proceso._id);
      if (proceso.formulario_estudiantes?.id_google_form) {
        await this.googleDriveService.eliminarArchivoDrive(proceso.formulario_estudiantes.id_google_form);
      }
      if (proceso.formulario_socios?.id_google_form) {
        await this.googleDriveService.eliminarArchivoDrive(proceso.formulario_socios.id_google_form);
      }
      const informes = proceso.informes_generados || [];
      for (const informe of informes) {
        await this.googleDriveService.eliminarArchivoDrive(informe.id_informe_drive);
      }
      this.eventEmitter.emit('proceso.eliminado', { procesoId: idProcesoStr });
      await this.procesosService.eliminarProcesoFisico(proceso.usuario_id, idProcesoStr);
      
      console.log(`[Background] Destrucción completada. Proceso ${idProcesoStr} erradicado.`);
    } catch (error) {
      console.error(`[Background] Error durante la destrucción del proceso ${proceso._id}:`, error);
    }
  }

}