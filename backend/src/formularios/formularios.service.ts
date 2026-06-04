import { Injectable, BadRequestException } from '@nestjs/common';
import { EstudianteEstrategia } from './estrategias/estudiante.estrategia';
import { SocioEstrategia } from './estrategias/socio.estrategia';
import { InjectModel } from '@nestjs/mongoose';
import { Proceso, ProcesoDocument } from './schemas/proceso.schema';
import { Model } from 'mongoose';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';
import { Plantilla, PlantillaDocument } from './schemas/plantilla.schema';
import { ArchivoGoogleDrive } from 'src/google/interfaces/archivo-google.interface';
import { Configuracion, ConfiguracionDocument } from './schemas/configuracion.schema';
import { FiltroPlantillas } from './interfaces/FiltroPlantillas';

@Injectable()
export class FormulariosService {
  constructor(
    private readonly estudianteEstrategia: EstudianteEstrategia,
    private readonly socioEstrategia: SocioEstrategia,
    @InjectModel(Proceso.name) private procesoModelo: Model<ProcesoDocument>,
    @InjectModel(Plantilla.name) private plantillaModelo: Model<PlantillaDocument>,
    @InjectModel(Configuracion.name) private configuracionModelo: Model<ConfiguracionDocument>,
  ) {}


  async obtenerTodosLosProcesos(usuario_id: string) {
    try {
      const procesos = await this.procesoModelo.find({ usuario_id }).sort({ createdAt: -1 }).exec();
      
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

  ejecutarProcesamiento(usuario_id: string, tipo: string, datos: any) {
    if (tipo === 'estudiante') {
      return this.estudianteEstrategia.procesarFormulario(datos);
    } 
    
    if (tipo === 'socio') {
      return this.socioEstrategia.procesarFormulario(datos);
    }

    throw new BadRequestException('Tipo de formulario no válido. Use "estudiante" o "socio".');
  }
  
  async actualizar(usuario_id: string, id: string, datos: ActualizarProcesoDto) {
    try 
    {
      const actualizado = await this.procesoModelo
        .findOneAndUpdate({ _id: id, usuario_id }, datos, { returnDocument: 'after' })
        .exec();
        
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
      const nuevoProceso = new this.procesoModelo({ ...datos, usuario_id });
      const procesoGuardado = await nuevoProceso.save();
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
    await this.plantillaModelo.deleteMany({ usuario_id }).exec();

    const plantillasNuevas = plantillasDeGoogle.map(archivo => ({
      idPlantilla: archivo.id,
      nombrePlantilla: archivo.name,
      usuario_id
    }));

    await this.plantillaModelo.insertMany(plantillasNuevas);
    return plantillasNuevas;
  }

  async obtenerPlantillasCacheadas(usuario_id: string, tipo?: string) 
  {
    const filtro: FiltroPlantillas = { usuario_id };

    if (tipo) 
    {
      filtro.nombrePlantilla = { $regex: new RegExp(tipo, 'i') };
    }
    const plantillas = await this.plantillaModelo.find(filtro).exec();
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
    let config = await this.configuracionModelo.findOne({ usuario_id }).exec();

    if (config) 
    {
      config.id_carpeta_destino_formularios = idCarpeta;
      await config.save();
    } 
    else 
    {
      config = new this.configuracionModelo({ usuario_id, id_carpeta_destino_formularios: idCarpeta });
      await config.save();
    }

    return { estado: 'exito'};
  }

  async obtenerCarpetaDestino(usuario_id: string): Promise<string> 
  {
    const config = await this.configuracionModelo.findOne({ usuario_id }).exec();
    
    if (!config || !config.id_carpeta_destino_formularios) 
    {
      throw new Error('No se ha configurado una carpeta de destino. Por favor, asigne una desde el panel principal.');
    }
    
    return config.id_carpeta_destino_formularios;
  }

  async obtenerProcesoInterno(usuario_id: string, id: string) 
  {
    const proceso = await this.procesoModelo.findOne({ _id: id, usuario_id }).exec();
    if (!proceso) 
    {
      throw new Error('El proceso que intentas eliminar no existe.');
    }
    return proceso;
  }

  async eliminarProcesoDeBD(usuario_id: string, id: string) 
  {
    await this.procesoModelo.findOneAndDelete({ _id: id, usuario_id }).exec();
    return { estado: 'exito', mensaje: 'Registro eliminado de la base de datos.' };
  }

  async buscarPorIdFormularioGoogle(idFormulario: string) 
  {
    return await this.procesoModelo.findOne({
      $or: [
        { 'formulario_estudiantes.id_google_form': idFormulario },
        { 'formulario_socios.id_google_form': idFormulario }
      ]
    }).exec();
  }

  async guardarMetadatosFormulario(
    usuario_id: string, 
    idProceso: string, 
    tipoFormulario: 'socios' | 'estudiantes', 
    nombresConstructos: string[], 
    totalEsperados: number
  ) {
    const campoBase = `formulario_${tipoFormulario}`;
    const datosAActualizar = {
      [`${campoBase}.nombres_constructos`]: nombresConstructos,
      [`${campoBase}.total_esperados`]: totalEsperados
    };

    return await this.actualizar(usuario_id, idProceso, datosAActualizar as any);
  }

}