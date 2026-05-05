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

@Injectable()
export class FormulariosService {
  constructor(
    private readonly estudianteEstrategia: EstudianteEstrategia,
    private readonly socioEstrategia: SocioEstrategia,
    @InjectModel(Proceso.name) private procesoModelo: Model<ProcesoDocument>,
    @InjectModel(Plantilla.name) private plantillaModelo: Model<PlantillaDocument>,
  ) {}


  async obtenerTodosLosProcesos() {
    try {
      const procesos = await this.procesoModelo.find().sort({ createdAt: -1 }).exec();
      
      const procesosFormateados = procesos.map((proceso) => {
        const doc = proceso.toObject();
        return {
          idProceso: doc._id.toString(),
          nombreProceso: doc.nombre_proceso,
          datos: {
            formulario_estudiantes: doc.formulario_estudiantes || null,
            formulario_socios: doc.formulario_socios || null
          }
        };
      });

      return {
        estado: 'exito',
        mensaje: 'Procesos obtenidos correctamente',
        datos: procesosFormateados
      };
    } catch (error) {
      console.error('Error al obtener los procesos:', error);
      throw new Error('Hubo un problema al intentar leer la base de datos.');
    }
  }

  ejecutarProcesamiento(tipo: string, datos: any) {
    if (tipo === 'estudiante') {
      return this.estudianteEstrategia.procesarFormulario(datos);
    } 
    
    if (tipo === 'socio') {
      return this.socioEstrategia.procesarFormulario(datos);
    }

    throw new BadRequestException('Tipo de formulario no válido. Use "estudiante" o "socio".');
  }
  
  async actualizar(id: string, datos: ActualizarProcesoDto) {
    try 
    {
      const actualizado = await this.procesoModelo
        .findByIdAndUpdate(id, datos, {returnDocument: 'after' })
        .exec();
        
      if (!actualizado) {
        throw new Error('No se encontró el proceso con ese ID');
      }

      return {
        mensaje: '¡Proceso actualizado con éxito!',
        datos: actualizado
      };
    } catch (error) {
      throw new Error('Error al actualizar el proceso');
    }
  }

  async crearProceso(datos: CrearProcesoDto) {
    try {
      const nuevoProceso = new this.procesoModelo(datos);
      const procesoGuardado = await nuevoProceso.save();
      return {
        datos: 
        {
          idProceso: procesoGuardado._id.toString(), // Convertimos el ObjectId de Mongoose a un string normal
          nombreProceso: procesoGuardado.nombre_proceso,
          anio: procesoGuardado.anio
        }
      };
    } catch (error) {
      console.error('Error al guardar en la base de datos:', error);
      throw new Error('No se pudo guardar el proceso en la base de datos.');
    }
  }

  async guardarPlantillasEnCache(plantillasDeGoogle: ArchivoGoogleDrive[]) 
  {
    await this.plantillaModelo.deleteMany({}).exec();

    const plantillasNuevas = plantillasDeGoogle.map(archivo => ({
      id_google_drive: archivo.id,
      nombre: archivo.name
    }));

    await this.plantillaModelo.insertMany(plantillasNuevas);
    return plantillasNuevas;
  }

  /**
   * Devuelve las plantillas al instante desde MongoDB.
   */
  async obtenerPlantillasCacheadas() 
  {
    const plantillas = await this.plantillaModelo.find().exec();
    return {
      estado: 'exito',
      datos: plantillas
    };
  }

}