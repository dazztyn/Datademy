import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { ImagenSubida } from '../interface/imagen-subida.interface';
import { ImagenProcesada } from '../interface/imagen-procesada.interface';

@Injectable()
export class ReportesDriveService {
  private drive: drive_v3.Drive;

  constructor(private readonly configService: ConfigService) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL')
    );
    oauth2Client.setCredentials({ refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN') });
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  async copiarPlantillaEnDrive(plantillaId: string, carpetaDestinoId: string, nombreCarrera: string): Promise<string> {
    const nombreInforme = `Informe de Resultados - ${nombreCarrera} - ${new Date().toLocaleDateString()}`;
    const copia = await this.drive.files.copy({
      fileId: plantillaId,
      requestBody: { name: nombreInforme, parents: [carpetaDestinoId] }
    });
    return copia.data.id!;
  }

  async subirImagenesEnLotes(imagenes: ImagenProcesada[], tamanoLote: number): Promise<ImagenSubida[]> {
    const resultados: ImagenSubida[] = [];
    for (let i = 0; i < imagenes.length; i += tamanoLote) {
      const lote = imagenes.slice(i, i + tamanoLote);
      const promesasLote = lote.map(async (img) => {
        const base64Puro = img.base64Completo.replace(/^data:image\/\w+;base64,/, '');
        const imagenDrive = await this.subirImagenTemporal(base64Puro);
        if(!imagenDrive.id || !imagenDrive.url) {
          throw new InternalServerErrorException(`Fallo al subir la imagen de la etiqueta ${img.etiqueta}`);
        }
        return { ...img, imagenDrive };
      });
      const loteSubido = await Promise.all(promesasLote);
      resultados.push(...loteSubido);
    }
    return resultados.sort((a, b) => b.posicion - a.posicion);
  }

  async limpiarArchivosTemporales(idsTemporales: string[], tamanoLote: number): Promise<void> {
    if (idsTemporales.length === 0) return;
    for (let i = 0; i < idsTemporales.length; i += tamanoLote) {
      const lote = idsTemporales.slice(i, i + tamanoLote);
      await Promise.all(
        lote.map(id => this.drive.files.delete({ fileId: id })
          .catch((e: Error) => console.error(`No se pudo borrar temporal ${id}`, e.message))
        )
      );
    }
  }

  private async subirImagenTemporal(base64String: string) {
    const buffer = Buffer.from(base64String, 'base64');
    const stream = Readable.from(buffer);
    const archivo = await this.drive.files.create({
      requestBody: { name: 'temp_grafico_ucn.png', mimeType: 'image/png' },
      media: { mimeType: 'image/png', body: stream },
      fields: 'id, webContentLink'
    });
    const fileId = archivo.data.id;
    const fileUrl = archivo.data.webContentLink;
    if (!fileId || !fileUrl) throw new InternalServerErrorException('Fallo al obtener ID temporal');

    await this.drive.permissions.create({
      fileId: fileId,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    return { id: fileId, url: fileUrl || '' };
  }
}