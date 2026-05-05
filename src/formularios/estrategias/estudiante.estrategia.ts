import { Injectable } from '@nestjs/common';
import { IProcesadorFormulario } from './formulario.estrategia.interface';

@Injectable()
export class EstudianteEstrategia implements IProcesadorFormulario {
  
  procesarFormulario(datos: any): string 
  {
    return `Formulario de ESTUDIANTE procesado correctamente: ${datos.nombre}`;
  }
}