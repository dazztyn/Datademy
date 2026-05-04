// src/formularios/formularios-orquestador.service.ts
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
    // 1. El orquestador delega el trabajo de la nube a GoogleService
    const resultadoCopia = await this.googleService.copiarPlantillaYGuardar(
      idPlantilla,
      nombreNuevoFormulario
    );

    const nuevoFormId = resultadoCopia.nuevo_id_google_form;
    const idCarpeta = process.env.CARPETA_MAESTRA_ID;

    // 2. Preparamos los datos
    const campoBase = `formulario_${tipoFormulario}`; 
    const datosAActualizar = {
      [`${campoBase}.id_google_form`]: nuevoFormId,
      [`${campoBase}.nombre_formulario`]: nombreNuevoFormulario,
      [`${campoBase}.id_carpeta_drive`]: idCarpeta 
    };

    // 3. El orquestador delega el trabajo de base de datos a FormulariosService
    const resultadoActualizacion = await this.formulariosService.actualizar(idProceso, datosAActualizar);

    return {
      estado: 'exito',
      mensaje: 'Formulario vinculado correctamente con arquitectura desacoplada.',
      idFormulario: nuevoFormId,
      urlEdicion: `https://docs.google.com/forms/d/${nuevoFormId}/edit`,
      datosActualizados: resultadoActualizacion.datos
    };
  }
}