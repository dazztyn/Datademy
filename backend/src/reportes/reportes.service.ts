import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { google, docs_v1, drive_v3  } from 'googleapis';
import { Readable } from 'stream';
import { ConfiguracionReportes, ConfiguracionReportesDocument } from './schemas/configuracion-reportes.schema';

@Injectable()
export class ReportesService {
  private oauth2Client;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(ConfiguracionReportes.name) private configModelo: Model<ConfiguracionReportesDocument>
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'https://developers.google.com/oauthplayground'
    );
    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN'),
    });
  }

  async actualizarConfiguracion(usuarioId: string, idCarpeta?: string, idPlantilla?: string) 
  {
    let config = await this.configModelo.findOne({ usuario_id: usuarioId }).exec();
    
    if (!config) {
      config = new this.configModelo({ usuario_id: usuarioId });
    }

    if (idCarpeta) config.id_carpeta_destino_informes = idCarpeta;
    if (idPlantilla) config.id_plantilla_informe = idPlantilla;

    await config.save();
    
    return { 
      estado: 'exito', 
      mensaje: 'Configuración actualizada correctamente.',
      configuracion_actual: {
        carpeta: config.id_carpeta_destino_informes || 'No configurada',
        plantilla: config.id_plantilla_informe || 'No configurada'
      }
    };
  }

  private async obtenerConfiguracion(usuarioId: string) {
    const config = await this.configModelo.findOne({ usuario_id: usuarioId }).exec();
    
    if (!config || !config.id_carpeta_destino_informes || !config.id_plantilla_informe) {
      throw new BadRequestException('Falta configurar la carpeta de destino o la plantilla en los ajustes de reportes.');
    }
    
    return {
      carpetaDestinoId: config.id_carpeta_destino_informes,
      plantillaId: config.id_plantilla_informe
    };
  }

  async crearInformeAutomatizado(
    usuarioId: string, 
    datosTexto: Record<string, string>,
    graficos: Record<string, string>,
    nombreCarrera: string = 'General'
  ) {
    const { plantillaId, carpetaDestinoId } = await this.obtenerConfiguracion(usuarioId);

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const docs = google.docs({ version: 'v1', auth: this.oauth2Client });

    try {

      const nombreInforme = `Informe de Resultados - ${nombreCarrera} - ${new Date().toLocaleDateString()}`;
      const copia = await drive.files.copy({
        fileId: plantillaId,
        requestBody: { name: nombreInforme, parents: [carpetaDestinoId] }
      });
      const nuevoDocId = copia.data.id!;

      const comandosGoogle: docs_v1.Schema$Request[] = [];
      const imagenesTemporalesIds: string[] = [];
      const estructuraDoc = await docs.documents.get({ documentId: nuevoDocId });

      const imagenesAInsertar: { etiqueta: string; posicion: number; base64Completo: string }[] = [];
      
      for (const [etiqueta, base64Completo] of Object.entries(graficos)) {
        const posicion = this.buscarPosicionEtiqueta(estructuraDoc.data, `{{${etiqueta}}}`);
        if (posicion > 0) {
          imagenesAInsertar.push({ etiqueta, posicion, base64Completo });
        }
      }

  
      imagenesAInsertar.sort((a, b) => b.posicion - a.posicion);

      for (const img of imagenesAInsertar) {
        const base64Puro = img.base64Completo.replace(/^data:image\/\w+;base64,/, '');
        const imagenDrive = await this.subirImagenTemporal(drive, base64Puro);
        if(!imagenDrive.id || !imagenDrive.url) 
        {
          throw new InternalServerErrorException('Error al subir la imagen temporal a Google Drive.');   
        }
        imagenesTemporalesIds.push(imagenDrive.id);

        comandosGoogle.push({
          deleteContentRange: { range: { startIndex: img.posicion, endIndex: img.posicion + img.etiqueta.length + 4 } }
        });

        comandosGoogle.push({
          insertInlineImage: {
            uri: imagenDrive.url,
            location: { index: img.posicion },
            objectSize: { width: { magnitude: 450, unit: 'PT' } } 
          }
        });
      }

      Object.entries(datosTexto).forEach(([llave, valor]) => {
        comandosGoogle.push({
          replaceAllText: { containsText: { text: `{{${llave}}}`, matchCase: true }, replaceText: String(valor) }
        });
      });

      if (comandosGoogle.length > 0) {
        await docs.documents.batchUpdate({
          documentId: nuevoDocId,
          requestBody: { requests: comandosGoogle }
        });
      }

      for (const idTemporal of imagenesTemporalesIds) {
        await drive.files.delete({ fileId: idTemporal });
      }

      return {
        estado: 'exito',
        url_informe: `https://docs.google.com/document/d/${nuevoDocId}/edit`
      };

    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException('Error al generar el informe: ' + err.message);
    }
  }

  private async subirImagenTemporal(drive: drive_v3.Drive, base64String: string) {
    const buffer = Buffer.from(base64String, 'base64');
    const stream = Readable.from(buffer);

    const archivo = await drive.files.create({
      requestBody: { name: 'temp_grafico_ucn.png', mimeType: 'image/png' },
      media: { mimeType: 'image/png', body: stream },
      fields: 'id, webContentLink'
    });

    const fileId = archivo.data.id;
    const fileUrl = archivo.data.webContentLink;
    
    if (!fileId || !fileUrl) 
    {
      throw new InternalServerErrorException('No se pudo obtener el ID del archivo temporal de Google Drive');
    }

    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: 'reader', type: 'anyone' }
    });

    return { id: fileId, url: fileUrl || '' };
  }

  private buscarPosicionEtiqueta(docData: docs_v1.Schema$Document, etiqueta: string): number {
    const contenido = docData.body?.content;
    if (!contenido) return -1;

    for (const elementoEstructural of contenido) {
      if (elementoEstructural.paragraph) {
        for (const elemento of elementoEstructural.paragraph.elements || []) {
          if (elemento.textRun?.content?.includes(etiqueta)) {
            return elemento.startIndex ?? -1; 
          }
        }
      }
    }
    return -1; 
  }
}