
import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { FormulariosService } from '../formularios.service';
import { GoogleService } from 'src/google/google.service';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';


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
    tipoFormulario: TipoFormulario
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

  async eliminarProcesoCompleto(usuario_id: string, idProceso: string) 
  {
    await this.formulariosService.actualizar(
      usuario_id, 
      idProceso, 
      { 
        estado: 'borrado_pendiente' 
      }
    );

    return {
      estado: 'exito',
      mensaje: 'El proceso ha sido marcado para eliminación. Se procesará en segundo plano.',
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

  async obtenerCantidadConstructos(usuario_id: string, idProceso: string, tipoFormulario: TipoFormulario) 
  {
    const proceso = await this.formulariosService.obtenerProcesoInterno(usuario_id, idProceso);
    const configFormulario = tipoFormulario === TipoFormulario.ESTUDIANTES ? proceso.formulario_estudiantes : proceso.formulario_socios;

    if (!configFormulario || !configFormulario.id_google_form) {
      throw new BadRequestException(`El formulario de ${tipoFormulario} aún no ha sido vinculado a este proceso.`);
    }

    const diseno = await this.googleService.obtenerDisenoFormulario(configFormulario.id_google_form);

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

}