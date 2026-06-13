import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EstadisticaDocument } from './schemas/estadisticas.schema';

@Injectable()
export class EstadisticasSeederService {
  constructor(
    @InjectModel('Estadistica') private readonly estadisticaModelo: Model<EstadisticaDocument>
  ) {}

  async generarVolumenDummy(procesoId: string, usuarioId: string, cantidad: number) {
    const respuestaBase = await this.estadisticaModelo.findOne({ proceso_id: procesoId }).lean().exec();

    if (!respuestaBase) {
      throw new BadRequestException('Debes tener al menos 1 respuesta real en este proceso para poder clonarla.');
    }

    const carreras = ['Ingeniería Comercial', 'Medicina', 'Derecho', 'Arquitectura', 'Psicología'];
    const generos = ['Masculino', 'Femenino', 'Prefiero no decirlo'];
    const sedes = ['Antofagasta', 'Coquimbo'];

    let creados = 0;

    for (let i = 0; i < cantidad; i++) {
      const clon = JSON.parse(JSON.stringify(respuestaBase));

      delete clon._id;
      delete clon.__v;

      clon.id_respuesta_google = `dummy_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      clon.fecha_respuesta = new Date(Date.now() - Math.floor(Math.random() * 2592000000)); 
      
      clon.datos_respondente.carrera = carreras[Math.floor(Math.random() * carreras.length)];
      clon.datos_respondente.genero = generos[Math.floor(Math.random() * generos.length)];
      clon.datos_respondente.sede = sedes[Math.floor(Math.random() * sedes.length)];

      (clon.constructos_paginas || []).forEach((pagina: any) => {
        (pagina.preguntas_pagina || []).forEach((preg: any) => {
          preg.valor_numerico = Math.floor(Math.random() * 5) + 1; 
          preg.respuesta_texto = `Opción generada aleatoriamente (${preg.valor_numerico})`;
        });
      });

      await new this.estadisticaModelo(clon).save();
      creados++;
    }

    return { 
      estado: 'exito', 
      mensaje: `¡Se generaron ${creados} respuestas falsas exitosamente! Ya puedes ver tu dashboard.` 
    };
  }
}