// src/formularios/estrategias/formulario.estrategia.interface.ts

// Este contrato obliga a que cualquier estrategia que creemos 
// tenga una función llamada 'procesarFormulario'.
export interface IProcesadorFormulario {
  procesarFormulario(datos: any): string;
}