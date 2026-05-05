
import { Injectable } from '@nestjs/common';
import { FormulariosService } from '../formularios.service';
import { GoogleService } from 'src/google/google.service';


@Injectable()
export class FormulariosOrquestadorService {
  constructor(
    private readonly formulariosService: FormulariosService,
    private readonly googleService: GoogleService
  ) {}

  async crearYVincularFormulario(
    idProceso: string,
    idPlantilla: string,
    nombreNuevoFormulario: string,
    tipoFormulario: 'socios' | 'estudiantes'
  ) {
    const resultadoCopia = await this.googleService.copiarPlantillaYGuardar(
      idPlantilla,
      nombreNuevoFormulario
    );

    const nuevoFormId = resultadoCopia.nuevo_id_google_form;
    const idCarpeta = process.env.CARPETA_MAESTRA_ID;

    const campoBase = `formulario_${tipoFormulario}`; 
    const datosAActualizar = {
      [`${campoBase}.id_google_form`]: nuevoFormId,
      [`${campoBase}.nombre_formulario`]: nombreNuevoFormulario,
      [`${campoBase}.id_carpeta_drive`]: idCarpeta 
    };

    const resultadoActualizacion = await this.formulariosService.actualizar(idProceso, datosAActualizar);

    return {
      estado: 'exito',
      idFormulario: nuevoFormId,
      urlEdicion: `https://docs.google.com/forms/d/${nuevoFormId}/edit`,
      datosActualizados: resultadoActualizacion.datos
    };
  }

  /**
   * Obtiene archivos de Google Drive y le dice al servicio de formularios que los guarde en caché.
   */
  async sincronizarCarpetaPlantillas(idCarpeta: string) 
  {
    try 
    {
      const archivosEnDrive = await this.googleService.listarPlantillas(idCarpeta);

      const plantillasGuardadas = await this.formulariosService.guardarPlantillasEnCache(archivosEnDrive);

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

}