import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { ArchivoGoogleDrive } from './interfaces/archivo-google.interface';

@Injectable()
export class GoogleService 
{
  private oauth2Client;

  constructor() 
  {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' 
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  async listarPlantillas(idCarpeta: string): Promise<ArchivoGoogleDrive[]> {
    try 
    {
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      
      const respuesta = await drive.files.list({
        q: `'${idCarpeta}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
      });

      return respuesta.data.files as ArchivoGoogleDrive[];
    } catch (error) {
      console.error('Error al listar archivos:', error);
      throw new Error('Hubo un problema al intentar conectar con Google Drive.');
    }
  }

  async copiarPlantillaYGuardar(idPlantilla: string, nombreNuevoFormulario: string) {
    try 
    {
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      const idCarpetaDestino = process.env.CARPETA_MAESTRA_ID;

      if (!idCarpetaDestino) {
        throw new Error('No se ha configurado la CARPETA_MAESTRA_ID en el archivo .env');
      }

      const respuesta = await drive.files.copy({
        fileId: idPlantilla,
        requestBody: {
          name: nombreNuevoFormulario,
          parents: [idCarpetaDestino], 
        },
      });

      const nuevoArchivo = respuesta.data;

      return {
        estado: 'exito',
        mensaje: 'Plantilla copiada correctamente usando OAuth 2.0',
        nuevo_id_google_form: nuevoArchivo.id,
      };

    } catch (error) {
      console.error('Error al copiar la plantilla en Drive:', error);
      throw new Error('Hubo un problema al intentar copiar el formulario de Google.');
    }
  }
}