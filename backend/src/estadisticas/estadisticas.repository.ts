import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EstadisticaDocument } from './schemas/estadisticas.schema';

@Injectable()
export class EstadisticasRepository {
  constructor(@InjectModel('Estadistica') private readonly modelo: Model<EstadisticaDocument>) {}

  async buscarPorQuery(queryMongo: any, selectCampos: string = '', sortOptions: any = {}) {
    return await this.modelo.find(queryMongo).select(selectCampos).sort(sortOptions).lean().exec();
  }

  async obtenerOpcionesDistintas(campo: string, queryMongo: any) {
    return await this.modelo.distinct(campo, queryMongo);
  }

  async insertarMultiples(documentos: any[]) {
    return await this.modelo.insertMany(documentos, { ordered: false });
  }

  async eliminarRespuestasPorProceso(procesoId: string): Promise<void> {
    await this.modelo.deleteMany({ proceso_id: procesoId }).exec();
  }

  async eliminarEstadisticasPorFiltro(filtro: Record<string, string>) {
    return await this.modelo.deleteMany(filtro);
  }

}