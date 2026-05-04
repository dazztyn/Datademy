import { Injectable, BadRequestException } from '@nestjs/common';
import { EstudianteEstrategia } from './estrategias/estudiante.estrategia';
import { SocioEstrategia } from './estrategias/socio.estrategia';
import { InjectModel } from '@nestjs/mongoose';
import { Proceso, ProcesoDocument } from './schemas/proceso.schema';
import { Model } from 'mongoose';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';
import { GoogleService } from 'src/google/google.service';

@Injectable()
export class FormulariosService {
  constructor(
    // Inyectamos ambas estrategias usando NestJS
    private readonly estudianteEstrategia: EstudianteEstrategia,
    private readonly socioEstrategia: SocioEstrategia,
    @InjectModel(Proceso.name) private procesoModelo: Model<ProcesoDocument>,
  ) {}


  async obtenerTodosLosProcesos() {
    try {
      // .find() sin parámetros trae todos los documentos de la colección
      // .sort({ createdAt: -1 }) los ordena de forma descendente (el más reciente arriba)
      const procesos = await this.procesoModelo.find().sort({ createdAt: -1 }).exec();
      
      const procesosFormateados = procesos.map((proceso) => {
        // Convertimos el documento de Mongoose a un objeto plano de JavaScript
        const doc = proceso.toObject();

        // Retornamos la nueva estructura limpia
        return {
          idProceso: doc._id.toString(), // Convertimos el ObjectId a texto
          nombreProceso: doc.nombre_proceso,
          // Agrupamos los formularios dentro del objeto "datos"
          datos: {
            // Usamos || null para que, si el formulario aún no se ha creado, devuelva null en vez de dar error
            formulario_socios: doc.formulario_socios || null,
            formulario_estudiantes: doc.formulario_estudiantes || null
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

  // Esta función decide qué estrategia usar
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
    try {
      // { new: true } hace que nos devuelva el objeto ya actualizado
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
        mensaje: '¡Proceso guardado exitosamente en MongoDB!',
        datos: procesoGuardado
      };
    } catch (error) {
      console.error('Error al guardar en la base de datos:', error);
      throw new Error('No se pudo guardar el proceso en la base de datos.');
    }
  }

}