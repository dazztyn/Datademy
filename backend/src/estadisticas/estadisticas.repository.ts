import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EstadisticaDocument } from './schemas/estadisticas.schema';
import { ConteoDemograficoRaw, NpsMongoRaw, PromedioMongoRaw } from './interfaces/metricas.interface';


@Injectable()
export class EstadisticasRepository {
  constructor(@InjectModel('Estadistica') private readonly modelo: Model<EstadisticaDocument>) {}

  async buscarPorQuery(
    queryMongo: Record<string, unknown>, 
    selectCampos: string = '', 
    sortOptions: Record<string, 1 | -1 | 'asc' | 'desc'> = {}
  ) {
    return await this.modelo.find(queryMongo).select(selectCampos).sort(sortOptions as any).lean().exec();
  }

  async obtenerOpcionesDistintas(campo: string, queryMongo: Record<string, unknown>) {
    return await this.modelo.distinct(campo, queryMongo);
  }

  async insertarMultiples(documentos: Array<Partial<EstadisticaDocument>>) {
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

  async calcularDistribucionGeneroMongo(queryMongo: Record<string, unknown>): Promise<ConteoDemograficoRaw[]> {
    return await this.modelo.aggregate<ConteoDemograficoRaw>([
      { $match: queryMongo },
      {
        $group: {
          _id: { $ifNull: ['$datos_respondente.genero', 'No especificado'] },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { cantidad: -1 } }
    ]).exec();
  }

  async calcularNpsMongo(queryMongo: Record<string, unknown>, ultimaPagina: number): Promise<NpsMongoRaw[]> {
    return await this.modelo.aggregate<NpsMongoRaw>([
      { $match: queryMongo },
      { $unwind: '$constructos_paginas' },
      { $match: { 'constructos_paginas.numero_pagina': ultimaPagina } },
      { $unwind: '$constructos_paginas.preguntas_pagina' },
      { $match: { 'constructos_paginas.preguntas_pagina.valor_numerico': { $gt: 0 } } },
      {
        $group: {
          _id: '$_id',
          promedio_usuario: { $avg: '$constructos_paginas.preguntas_pagina.valor_numerico' }
        }
      },
      {
        $group: {
          _id: null,
          promotores: { $sum: { $cond: [{ $gte: ['$promedio_usuario', 6] }, 1, 0] } },
          pasivos: { $sum: { $cond: [{ $and: [{ $gte: ['$promedio_usuario', 5] }, { $lt: ['$promedio_usuario', 6] }] }, 1, 0] } },
          detractores: { $sum: { $cond: [{ $lt: ['$promedio_usuario', 5] }, 1, 0] } },
          totalValidos: { $sum: 1 }
        }
      }
    ]).exec();
  }

}