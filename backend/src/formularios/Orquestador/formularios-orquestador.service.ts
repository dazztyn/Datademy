
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FormulariosService } from '../formularios.service';
import { GoogleService } from 'src/google/google.service';
import { InjectConnection } from '@nestjs/mongoose'; 
import { Connection } from 'mongoose';


@Injectable()
export class FormulariosOrquestadorService {
  constructor(
    private readonly formulariosService: FormulariosService,
    private readonly googleService: GoogleService,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async crearYVincularFormulario(
    usuario_id: string,
    idProceso: string,
    idPlantilla: string,
    nombreNuevoFormulario: string,
    tipoFormulario: 'socios' | 'estudiantes'
  ) 
  {

    const idCarpetaDestino = await this.formulariosService.obtenerCarpetaDestino(usuario_id);
    const resultadoCopia = await this.googleService.copiarPlantillaYGuardar(
      idPlantilla,
      nombreNuevoFormulario,
      idCarpetaDestino
    );

    const nuevoFormId = resultadoCopia.nuevo_id_google_form;

    if (!nuevoFormId) 
    {
      throw new InternalServerErrorException('Error crítico: Google Drive no retornó un ID válido al clonar el formulario.');
    }

    await this.googleService.activarVigilanciaRespuestas(nuevoFormId);

    const urlEdicionGenerada = `https://docs.google.com/forms/d/${nuevoFormId}/edit`;
    const urlRespuestaGenerada = `https://docs.google.com/forms/d/${nuevoFormId}/viewform`;

    const campoBase = `formulario_${tipoFormulario}`; 
    const datosAActualizar = {
      [`${campoBase}.id_google_form`]: nuevoFormId,
      [`${campoBase}.nombre_formulario`]: nombreNuevoFormulario,
      [`${campoBase}.id_carpeta_drive`]: idCarpetaDestino,
      [`${campoBase}.url_edicion`]: urlEdicionGenerada,
      [`${campoBase}.url_respuesta`]: urlRespuestaGenerada
    };

    const resultadoActualizacion = await this.formulariosService.actualizar(usuario_id, idProceso, datosAActualizar);

    return {
      estado: 'exito',
      idFormulario: nuevoFormId,
      nombreFormulario: nombreNuevoFormulario,
      idCarpetaDrive: idCarpetaDestino,
      urlEdicion: urlEdicionGenerada,
      urlRespuesta: urlRespuestaGenerada,
      datosActualizados: resultadoActualizacion.datos
    };
  }

  async sincronizarCarpetaPlantillas(usuario_id: string, idCarpeta: string) 
  {
    try 
    {
      const archivosEnDrive = await this.googleService.listarPlantillas(idCarpeta);

      const plantillasGuardadas = await this.formulariosService.guardarPlantillasEnCache(usuario_id, archivosEnDrive);

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

  async eliminarProcesoCompleto(usuario_id: string, idProceso: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const proceso = await this.formulariosService.obtenerProcesoInterno(usuario_id, idProceso);

      await this.formulariosService.eliminarProcesoDeBD(usuario_id, idProceso, session);

      if (proceso.formulario_socios?.id_google_form) {
        await this.googleService.enviarArchivoAPapelera(proceso.formulario_socios.id_google_form);
      }
      
      if (proceso.formulario_estudiantes?.id_google_form) {
        await this.googleService.enviarArchivoAPapelera(proceso.formulario_estudiantes.id_google_form);
      }

      await session.commitTransaction();

      return {
        estado: 'exito',
        idProcesoEliminado: idProceso
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Error crítico al eliminar proceso. Transacción abortada:', error);
      throw new InternalServerErrorException('No se pudo completar la eliminación. Los datos en base de datos fueron protegidos.');
    } finally {
      session.endSession();
    }
  }
  
  async vincularFormularioExistente(
    usuario_id: string,
    idProceso: string,
    idFormularioExistente: string,
    tipoFormulario: 'socios' | 'estudiantes'
  ) {
    try {
      const diseno = await this.googleService.obtenerDisenoFormulario(idFormularioExistente);
      const nombreFormulario = diseno.info?.title || 'Formulario Importado';
      await this.googleService.activarVigilanciaRespuestas(idFormularioExistente);
      const urlEdicion = `https://docs.google.com/forms/d/${idFormularioExistente}/edit`;
      const urlRespuesta = `https://docs.google.com/forms/d/${idFormularioExistente}/viewform`;
      const campoBase = `formulario_${tipoFormulario}`;
      const datosAActualizar = {
        [`${campoBase}.id_google_form`]: idFormularioExistente,
        [`${campoBase}.nombre_formulario`]: nombreFormulario,
        [`${campoBase}.id_carpeta_drive`]: 'importado_externamente', 
        [`${campoBase}.url_edicion`]: urlEdicion,
        [`${campoBase}.url_respuesta`]: urlRespuesta
      };

      const resultadoActualizacion = await this.formulariosService.actualizar(usuario_id, idProceso, datosAActualizar);

      return {
        estado: 'exito',
        mensaje: 'Formulario existente vinculado y bajo vigilancia',
        idFormulario: idFormularioExistente,
        nombreFormulario: nombreFormulario,
        urlEdicion,
        urlRespuesta,
        datosActualizados: resultadoActualizacion.datos
      };
    } catch (error) {
      console.error('Error al vincular formulario existente:', error);
      throw new InternalServerErrorException('No se pudo vincular el formulario. Verifique que el ID sea correcto y tenga permisos.');
    }
  }

}