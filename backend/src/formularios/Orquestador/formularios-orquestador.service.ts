
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

}