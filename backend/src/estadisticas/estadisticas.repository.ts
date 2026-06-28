import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Estadistica, EstadisticaDocument } from './schemas/estadisticas.schema';
import { PromedioMongoRaw } from './interfaces/promedios.interface';


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

  async calcularPromediosAgrupadosPorPagina(queryMongo: Record<string, unknown>
  ): Promise<PromedioMongoRaw[]>
  {
    return await this.modelo.aggregate<PromedioMongoRaw>([
      { $match: queryMongo },
      
      { $unwind: '$constructos_paginas' },
      { $unwind: '$constructos_paginas.preguntas_pagina' },
      
      { $match: { 'constructos_paginas.preguntas_pagina.valor_numerico': { $gt: 0 } } },
      
      {
        $group: {
          _id: '$constructos_paginas.numero_pagina',
          promedio_bruto: { $avg: '$constructos_paginas.preguntas_pagina.valor_numerico' }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec();
  }

}