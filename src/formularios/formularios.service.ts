import { Injectable, BadRequestException } from '@nestjs/common';
import { EstudianteEstrategia } from './estrategias/estudiante.estrategia';
import { SocioEstrategia } from './estrategias/socio.estrategia';
import { InjectModel } from '@nestjs/mongoose';
import { Proceso, ProcesoDocument } from './schemas/proceso.schema';
import { Model } from 'mongoose';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';

@Injectable()
export class FormulariosService {
  constructor(
    // Inyectamos ambas estrategias usando NestJS
    private readonly estudianteEstrategia: EstudianteEstrategia,
    private readonly socioEstrategia: SocioEstrategia,
    @InjectModel(Proceso.name) private procesoModelo: Model<ProcesoDocument>,
  ) {}

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
        .findByIdAndUpdate(id, datos, { new: true })
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