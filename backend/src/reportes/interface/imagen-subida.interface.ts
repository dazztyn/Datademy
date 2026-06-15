import { ImagenProcesada } from "./imagen-procesada.interface";

export interface ImagenSubida extends ImagenProcesada 
{
  imagenDrive: {
    id: string;
    url: string;
  };
}