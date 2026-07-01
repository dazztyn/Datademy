import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plantilla, PlantillaDocument } from '../schemas/plantilla.schema';
import { FiltroPlantillas } from '../interfaces/FiltroPlantillas';

@Injectable()
export class PlantillasRepository {
  constructor(@InjectModel(Plantilla.name) private readonly modelo: Model<PlantillaDocument>) {}

  async borrarPlantillas(usuario_id: string): Promise<void> {
    await this.modelo.deleteMany({ usuario_id }).exec();
  }

  async insertarPlantillas(plantillas: { idPlantilla: string; nombrePlantilla: string; usuario_id: string }[]): Promise<PlantillaDocument[]> {
    const insertados = await this.modelo.insertMany(plantillas);
    return insertados as unknown as PlantillaDocument[];
  }

  async encontrarPlantillas(filtro: FiltroPlantillas): Promise<PlantillaDocument[]> {
    return await this.modelo.find(filtro).exec();
  }
}