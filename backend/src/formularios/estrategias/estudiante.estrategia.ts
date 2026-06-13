import { Injectable } from '@nestjs/common';
import { IProcesadorFormulario } from './formulario.estrategia.interface';

@Injectable()
export class EstudianteEstrategia implements IProcesadorFormulario {
  
  procesarFormulario(datos: Record<string, string>): string 
  {
    return `Formulario de ESTUDIANTE procesado correctamente: ${datos.nombre}`;
  }
}