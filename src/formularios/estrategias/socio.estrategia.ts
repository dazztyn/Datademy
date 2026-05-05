import { Injectable } from '@nestjs/common';
import { IProcesadorFormulario } from './formulario.estrategia.interface';

@Injectable()
export class SocioEstrategia implements IProcesadorFormulario {
  
  procesarFormulario(datos: any): string 
  {
    return `Formulario de SOCIO COMUNITARIO procesado correctamente: ${datos.organizacion}`;
  }
}