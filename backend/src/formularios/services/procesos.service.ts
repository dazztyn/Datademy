import { Injectable } from '@nestjs/common';
import { UpdateQuery } from 'mongoose';
import { CrearProcesoDto } from '../dto/crear-proceso.dto';
import { ActualizarProcesoDto } from '../dto/actualizar-proceso.dto';
import { ProcesosRepository } from '../repository/procesos.repository';
import { ProcesoDocument } from '../schemas/proceso.schema';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';
import { InformeGenerado } from '../interfaces/informe-generado.interface';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ProcesosService {
  constructor(private readonly procesosRepo: ProcesosRepository) {}

  async obtenerTodosLosProcesos(usuario_id: string) {
    try {
      const procesos = await this.procesosRepo.encontrarProcesosActivos(usuario_id);
      return { 
        estado: 'exito', 
        procesos: procesos.map(p => {
          const doc = p.toObject();
          return {
            idProceso: doc._id.toString(),
            nombreProceso: doc.nombre_proceso,
            anio: doc.anio,
            formularios: {
              formulario_estudiantes: doc.formulario_estudiantes || null,
              formulario_socios: doc.formulario_socios || null
            }
          };
        }) 
      };
    } catch (error) {
      throw new Error('Hubo un problema al intentar leer la base de datos.');
    }
  }
  
  async actualizar(usuario_id: string, id: string, datos: ActualizarProcesoDto | UpdateQuery<ProcesoDocument>) {
    const actualizado = await this.procesosRepo.actualizarProceso(usuario_id, id, datos);
    if (!actualizado) throw new Error('No se encontró el proceso con ese ID');
    return {
      mensaje: '¡Proceso actualizado con éxito!',
      datos: { idProceso: actualizado._id.toString(), nombreProceso: actualizado.nombre_proceso, anio: actualizado.anio }
    };
  }

  async crearProceso(usuario_id: string, datos: CrearProcesoDto) {
    const procesoGuardado = await this.procesosRepo.crearProceso({ ...datos, usuario_id });
    return { datos: { idProceso: procesoGuardado._id.toString(), nombreProceso: procesoGuardado.nombre_proceso, anio: procesoGuardado.anio } };
  }

  async obtenerProcesoInterno(usuario_id: string, id: string) {
    const proceso = await this.procesosRepo.encontrarProcesoPorId(usuario_id, id);
    if (!proceso) throw new Error('El proceso que intentas buscar no existe.');
    return proceso;
  }

  async buscarPorIdFormularioGoogle(idFormulario: string) {
    return await this.procesosRepo.buscarPorIdFormularioGoogle(idFormulario);
  }

  async guardarMetadatosFormulario(usuario_id: string, idProceso: string, tipoFormulario: 'socios' | 'estudiantes', nombresConstructos: string[], totalEsperados: number) {
    const campoBase = `formulario_${tipoFormulario}`;
    const datosAActualizar: UpdateQuery<ProcesoDocument> = {
      [`${campoBase}.nombres_constructos`]: nombresConstructos,
      [`${campoBase}.total_esperados`]: totalEsperados
    };
    return await this.actualizar(usuario_id, idProceso, datosAActualizar);
  }

  async obtenerMetadatosGuardados(usuario_id: string, idProceso: string) {
    const proceso = await this.obtenerProcesoInterno(usuario_id, idProceso);
    const est = proceso.formulario_estudiantes;
    const soc = proceso.formulario_socios;
    const completos = (est?.nombres_constructos?.length ?? 0) > 0 && (soc?.nombres_constructos?.length ?? 0) > 0 && (est?.total_esperados ?? 0) > 0 && (soc?.total_esperados ?? 0) > 0;

    return {
      estado: 'exito',
      estan_completos: completos,
      metadatos: {
        estudiantes: { nombres_constructos: est?.nombres_constructos || [], total_esperados: est?.total_esperados || '' },
        socios: { nombres_constructos: soc?.nombres_constructos || [], total_esperados: soc?.total_esperados || '' }
      }
    };
  }

  async desasignarFormulario(usuario_id: string, idProceso: string, tipoFormulario: TipoFormulario) {
    const campoBase = tipoFormulario === TipoFormulario.ESTUDIANTES 
      ? 'formulario_estudiantes' 
      : 'formulario_socios';
    
    const datosAActualizar: UpdateQuery<ProcesoDocument> = {
      $set: { [campoBase]: null }
    };

    const actualizado = await this.procesosRepo.actualizarProceso(usuario_id, idProceso, datosAActualizar);
    
    if (!actualizado) {
      throw new Error('No se pudo desasignar: El proceso no existe o no tienes permisos.');
    }

    return {
      estado: 'exito',
      mensaje: `Formulario de ${tipoFormulario} desasignado correctamente del proceso.`,
      datos: {
        idProceso: String(actualizado._id),
        nombreProceso: actualizado.nombre_proceso
      }
    };
  }

  async guardarInformeEnProceso(
    usuario_id: string, 
    idProceso: string, 
    informe: InformeGenerado 
  ) {
    const proceso = await this.obtenerProcesoInterno(usuario_id, idProceso);
    
    const informesActuales = proceso.informes_generados || [];

    informesActuales.push(informe);

    const actualizado = await this.procesosRepo.actualizarProceso(usuario_id, idProceso, {
      informes_generados: informesActuales
    });

    if (!actualizado) throw new Error('No se pudo guardar el informe en el proceso.');
    return actualizado;
  }

  async obtenerInformesDeProceso(usuario_id: string, idProceso: string) {
    const proceso = await this.obtenerProcesoInterno(usuario_id, idProceso);
    return {
      estado: 'exito',
      informes: proceso.informes_generados || [] 
    };
  }

  async eliminarInformeDeProceso(usuario_id: string, idProceso: string, idInformeDrive: string) {
    const proceso = await this.obtenerProcesoInterno(usuario_id, idProceso);

    const informesRestantes = (proceso.informes_generados || []).filter(
      (inf) => inf.id_informe_drive !== idInformeDrive
    );

    const actualizado = await this.actualizar(usuario_id, idProceso, {
      informes_generados: informesRestantes
    });

    if (!actualizado) throw new Error('No se encontró el proceso o no tienes permisos.');
    
    return actualizado;

  }

  @OnEvent('informe.generado')
  async manejarInformeGeneradoTerminado(payload: { usuarioId: string, idProceso: string, informe: InformeGenerado }) {
    try {
      await this.guardarInformeEnProceso(payload.usuarioId, payload.idProceso, payload.informe);
      console.log(`[Event Bus] Informe guardado correctamente en el proceso ${payload.idProceso}`);
    } catch (error) {
      console.error('[Event Bus] Error al guardar el informe generado:', error);
    }
  }
}