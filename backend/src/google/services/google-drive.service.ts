import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { ArchivoGoogleDrive } from '../interfaces/archivo-google.interface';

@Injectable()
export class GoogleDriveService {
  private oauth2Client;
  private drive: drive_v3.Drive;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'https://developers.google.com/oauthplayground'
    );

    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN'),
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async listarPlantillas(idCarpeta: string): Promise<ArchivoGoogleDrive[]> {
    try {
      const respuesta = await this.drive.files.list({
        q: `'${idCarpeta}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
      });
      return respuesta.data.files as ArchivoGoogleDrive[];
    } catch (error) {
      console.error('Error al listar archivos:', error);
      throw new Error('Hubo un problema al intentar conectar con Google Drive.');
    }
  }

  async copiarPlantillaYGuardar(idPlantilla: string, nombreNuevoFormulario: string, idCarpetaDestino: string) {
    try {
      if (!idCarpetaDestino) {
        throw new Error('No se ha proporcionado una carpeta de destino válida.');
      }
      const respuesta = await this.drive.files.copy({
        fileId: idPlantilla,
        requestBody: {
          name: nombreNuevoFormulario,
          parents: [idCarpetaDestino],
        },
      });
      return {
        estado: 'exito',
        mensaje: 'Plantilla copiada correctamente usando OAuth 2.0',
        nuevo_id_google_form: respuesta.data.id,
      };
    } catch (error) {
      console.error('Error al copiar la plantilla en Drive:', error);
      throw new Error('Hubo un problema al intentar copiar el formulario de Google.');
    }
  }

  async enviarArchivoAPapelera(idArchivo: string): Promise<void> {
    try {
      await this.drive.files.update({
        fileId: idArchivo,
        requestBody: { trashed: true },
      });
    } catch (error) {
      console.error(`Aviso: No se pudo mover el archivo ${idArchivo} a la papelera (es posible que ya no exista).`);
    }
  }

  async eliminarArchivoDrive(idArchivo: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId: idArchivo });
      console.log(`Archivo ${idArchivo} eliminado de Google Drive exitosamente.`);
    } catch (error: unknown) {
      console.warn(`Aviso: No se pudo eliminar el archivo de Drive. ID: ${idArchivo}`);
    }
  }
}