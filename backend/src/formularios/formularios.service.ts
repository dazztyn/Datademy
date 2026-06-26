import { Injectable } from '@nestjs/common';
import { ProcesoDocument } from './schemas/proceso.schema';
import { UpdateQuery } from 'mongoose';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';
import { ArchivoGoogleDrive } from 'src/google/interfaces/archivo-google.interface';
import { FiltroPlantillas } from './interfaces/FiltroPlantillas';
import { ProcesosRepository } from './repository/procesos.repository';
import { PlantillasRepository } from './repository/plantillas.repository';
import { ConfiguracionesRepository } from './repository/configuraciones.repository';


@Injectable()
export class FormulariosService {
  constructor(
    private readonly procesosRepo: ProcesosRepository,
    private readonly plantillasRepo: PlantillasRepository,
    private readonly configRepo: ConfiguracionesRepository
  ) {}


  async obtenerTodosLosProcesos(usuario_id: string) {
    try {
      const procesos = await this.procesosRepo.encontrarProcesosActivos(usuario_id);
      
      const procesosFormateados = procesos.map((proceso) => {
        const doc = proceso.toObject();
        return {
          idProceso: doc._id.toString(),
          nombreProceso: doc.nombre_proceso,
          anio: doc.anio,
          formularios: {
            formulario_estudiantes: doc.formulario_estudiantes || null,
            formulario_socios: doc.formulario_socios || null
          }
        };
      });

      return {
        estado: 'exito',
        procesos: procesosFormateados
      };
    } catch (error) {
      console.error('Error al obtener los procesos:', error);
      throw new Error('Hubo un problema al intentar leer la base de datos.');
    }
  }
  
  async actualizar(usuario_id: string, id: string, datos: ActualizarProcesoDto | UpdateQuery<ProcesoDocument>) {
    try 
    {
      const actualizado = await this.procesosRepo.actualizarProceso(usuario_id, id, datos);
        
      if (!actualizado) {
        throw new Error('No se encontró el proceso con ese ID');
      }

      return {
        mensaje: '¡Proceso actualizado con éxito!',
        datos: 
        {
          idProceso: actualizado._id.toString(),
          nombreProceso: actualizado.nombre_proceso,
          anio: actualizado.anio
        }
      };
    } catch (error) {
      throw new Error('Error al actualizar el proceso');
    }
  }

  async crearProceso(usuario_id: string, datos: CrearProcesoDto) {
    try {
      const procesoGuardado = await this.procesosRepo.crearProceso({ ...datos, usuario_id });
      return {
        datos: 
        {
          idProceso: procesoGuardado._id.toString(),
          nombreProceso: procesoGuardado.nombre_proceso,
          anio: procesoGuardado.anio
        }
      };
    } catch (error) {
      console.error('Error al guardar en la base de datos:', error);
      throw new Error('No se pudo guardar el proceso en la base de datos.');
    }
  }

  async guardarPlantillasEnCache(usuario_id: string, plantillasDeGoogle: ArchivoGoogleDrive[]) 
  {
    await this.plantillasRepo.borrarPlantillas(usuario_id);

    const plantillasNuevas = plantillasDeGoogle.map(archivo => ({
      idPlantilla: archivo.id,
      nombrePlantilla: archivo.name,
      usuario_id
    }));

    await this.plantillasRepo.insertarPlantillas(plantillasNuevas);
    return plantillasNuevas;
  }

  async obtenerPlantillasCacheadas(usuario_id: string, tipo?: string) 
  {
    const filtro: FiltroPlantillas = { usuario_id };

    if (tipo) 
    {
      filtro.nombrePlantilla = { $regex: new RegExp(tipo, 'i') };
    }
    const plantillas = await this.plantillasRepo.encontrarPlantillas(filtro);
    const plantillasFiltradas = plantillas.map((plantilla) => {
        const doc = plantilla.toObject();
        return {
          idPlantilla: doc.idPlantilla.toString(),
          nombrePlantilla: doc.nombrePlantilla
        };
      });
    return {
      estado: 'exito',
      datos: plantillasFiltradas
    };
  }

  async guardarCarpetaDestino(usuario_id: string, idCarpeta: string) 
  {
    await this.configRepo.guardarCarpetaDestino(usuario_id, idCarpeta);

    return { estado: 'exito'};
  }

  async obtenerCarpetaDestino(usuario_id: string): Promise<string> 
  {
    const config = await this.configRepo.encontrarConfiguracion(usuario_id);
    
    if (!config || !config.id_carpeta_destino_formularios) 
    {
      throw new Error('No se ha configurado una carpeta de destino. Por favor, asigne una desde el panel principal.');
    }
    
    return config.id_carpeta_destino_formularios;
  }

  async obtenerProcesoInterno(usuario_id: string, id: string) 
  {
    const proceso = await this.procesosRepo.encontrarProcesoPorId(usuario_id, id);
    if (!proceso) 
    {
      throw new Error('El proceso que intentas buscar no existe.');
    }
    return proceso;
  }

  async buscarPorIdFormularioGoogle(idFormulario: string) 
  {
    return await this.procesosRepo.buscarPorIdFormularioGoogle(idFormulario);
  }

  async guardarMetadatosFormulario(
    usuario_id: string, 
    idProceso: string, 
    tipoFormulario: 'socios' | 'estudiantes', 
    nombresConstructos: string[], 
    totalEsperados: number
  ) {
    const campoBase = `formulario_${tipoFormulario}`;
    const datosAActualizar: UpdateQuery<ProcesoDocument> = {
      [`${campoBase}.nombres_constructos`]: nombresConstructos,
      [`${campoBase}.total_esperados`]: totalEsperados
    };

    return await this.actualizar(usuario_id, idProceso, datosAActualizar);
  }

}