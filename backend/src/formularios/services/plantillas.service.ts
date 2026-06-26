import { Injectable } from '@nestjs/common';
import { ArchivoGoogleDrive } from 'src/google/interfaces/archivo-google.interface';
import { FiltroPlantillas } from '../interfaces/FiltroPlantillas';
import { PlantillasRepository } from '../repository/plantillas.repository';


@Injectable()
export class PlantillasService {
  constructor(private readonly plantillasRepo: PlantillasRepository) {}

  async guardarPlantillasEnCache(usuario_id: string, plantillasDeGoogle: ArchivoGoogleDrive[]) {
    await this.plantillasRepo.borrarPlantillas(usuario_id);
    const plantillasNuevas = plantillasDeGoogle.map(archivo => ({
      idPlantilla: archivo.id,
      nombrePlantilla: archivo.name,
      usuario_id
    }));
    await this.plantillasRepo.insertarPlantillas(plantillasNuevas);
    return plantillasNuevas;
  }

  async obtenerPlantillasCacheadas(usuario_id: string, tipo?: string) {
    const filtro: FiltroPlantillas = { usuario_id };
    if (tipo) filtro.nombrePlantilla = { $regex: new RegExp(tipo, 'i') };
    const plantillas = await this.plantillasRepo.encontrarPlantillas(filtro);
    return { 
      estado: 'exito', 
      datos: plantillas.map(p => ({ idPlantilla: p.idPlantilla, nombrePlantilla: p.nombrePlantilla })) 
    };
  }
}