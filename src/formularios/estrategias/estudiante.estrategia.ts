import { Injectable } from '@nestjs/common';
import { IProcesadorFormulario } from './formulario.estrategia.interface';

@Injectable()
export class EstudianteEstrategia implements IProcesadorFormulario {
  
  procesarFormulario(datos: any): string {
    // Aquí irá toda la lógica compleja exclusiva para estudiantes
    // Ej: Validar matrícula, buscar notas, etc.
    return `Formulario de ESTUDIANTE procesado correctamente: ${datos.nombre}`;
  }
}