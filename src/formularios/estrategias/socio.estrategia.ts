import { Injectable } from '@nestjs/common';
import { IProcesadorFormulario } from './formulario.estrategia.interface';

@Injectable()
export class SocioEstrategia implements IProcesadorFormulario {
  
  procesarFormulario(datos: any): string {
    // Aquí irá la lógica exclusiva para socios comunitarios
    // Ej: Validar nombre de la organización, rut de empresa, etc.
    return `Formulario de SOCIO COMUNITARIO procesado correctamente: ${datos.organizacion}`;
  }
}