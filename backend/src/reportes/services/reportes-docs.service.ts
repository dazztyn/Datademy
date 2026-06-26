import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, docs_v1 } from 'googleapis';
import { ImagenProcesada } from '../interface/imagen-procesada.interface';
import { ImagenSubida } from '../interface/imagen-subida.interface';

@Injectable()
export class ReportesDocsService {
  private docs: docs_v1.Docs;

  constructor(private readonly configService: ConfigService) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL')
    );
    oauth2Client.setCredentials({ refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN') });
    this.docs = google.docs({ version: 'v1', auth: oauth2Client });
  }

  async identificarUbicacionGraficos(documentId: string, graficos: Record<string, string>): Promise<ImagenProcesada[]> {
    const estructuraDoc = await this.docs.documents.get({ documentId });
    const imagenesAInsertar: ImagenProcesada[] = [];
    
    for (const [etiqueta, base64Completo] of Object.entries(graficos)) {
      const posicion = this.buscarPosicionEtiqueta(estructuraDoc.data, `{{${etiqueta}}}`);
      if (posicion > 0) {
        imagenesAInsertar.push({ etiqueta, posicion, base64Completo });
      }
    }
    return imagenesAInsertar;
  }

  async aplicarCambios(documentId: string, imagenesSubidas: ImagenSubida[], datosTexto: Record<string, string>): Promise<void> {
    const comandos: docs_v1.Schema$Request[] = [];

    for (const img of imagenesSubidas) {
      comandos.push({ deleteContentRange: { range: { startIndex: img.posicion, endIndex: img.posicion + img.etiqueta.length + 4 } } });
      comandos.push({
        insertInlineImage: {
          uri: img.imagenDrive.url,
          location: { index: img.posicion },
          objectSize: { width: { magnitude: 450, unit: 'PT' } } 
        }
      });
    }

    Object.entries(datosTexto).forEach(([llave, valor]) => {
      comandos.push({ replaceAllText: { containsText: { text: `{{${llave}}}`, matchCase: true }, replaceText: String(valor) } });
    });

    if (comandos.length > 0) {
      await this.docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: { requests: comandos }
      });
    }
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