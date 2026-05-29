
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FormulariosService } from '../formularios.service';
import { GoogleService } from 'src/google/google.service';


@Injectable()
export class FormulariosOrquestadorService {
  constructor(
    private readonly formulariosService: FormulariosService,
    private readonly googleService: GoogleService
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

  /**
   * Obtiene archivos de Google Drive y le dice al servicio de formularios que los guarde en caché.
   */
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

  /**
   * Orquesta la eliminación completa: Borra archivos de Drive y luego el registro en MongoDB.
   */
  async eliminarProcesoCompleto(usuario_id: string, idProceso: string) 
  {
    const proceso = await this.formulariosService.obtenerProcesoInterno(usuario_id, idProceso);

    if (proceso.formulario_socios && proceso.formulario_socios.id_google_form) 
    {
      await this.googleService.enviarArchivoAPapelera(proceso.formulario_socios.id_google_form);
    }
    
    if (proceso.formulario_estudiantes && proceso.formulario_estudiantes.id_google_form) 
    {
      await this.googleService.enviarArchivoAPapelera(proceso.formulario_estudiantes.id_google_form);
    }

    await this.formulariosService.eliminarProcesoDeBD(usuario_id, idProceso);

    return {
      estado: 'exito',
      idProcesoEliminado: idProceso
    };
  }
  
  /**
   * Vincula un formulario que el usuario ya tenía publicado en su Google Drive,
   * sin necesidad de clonar una plantilla.
   */
  async vincularFormularioExistente(
    usuario_id: string,
    idProceso: string,
    idFormularioExistente: string,
    tipoFormulario: 'socios' | 'estudiantes'
  ) {
    try {
      // 1. Obtenemos el diseño para extraer el título real que le puso el profesor
      const diseno = await this.googleService.obtenerDisenoFormulario(idFormularioExistente);
      const nombreFormulario = diseno.info?.title || 'Formulario Importado';

      // 2. Encendemos el Webhook de Datademy en ese formulario viejo
      await this.googleService.activarVigilanciaRespuestas(idFormularioExistente);

      // 3. Reconstruimos las URLs estándar de Google
      const urlEdicion = `https://docs.google.com/forms/d/${idFormularioExistente}/edit`;
      const urlRespuesta = `https://docs.google.com/forms/d/${idFormularioExistente}/viewform`;

      // 4. Actualizamos el registro en MongoDB
      const campoBase = `formulario_${tipoFormulario}`;
      const datosAActualizar = {
        [`${campoBase}.id_google_form`]: idFormularioExistente,
        [`${campoBase}.nombre_formulario`]: nombreFormulario,
        [`${campoBase}.id_carpeta_drive`]: 'importado_externamente', // Como no lo creamos, marcamos el origen
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