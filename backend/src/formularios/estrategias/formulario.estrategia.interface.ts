
export interface IProcesadorFormulario {
  procesarFormulario(datos: Record<string, string | number | boolean>): string;
}