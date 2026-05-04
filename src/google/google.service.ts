import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleService {
  // 1. Declaramos la variable para nuestro nuevo cliente OAuth2
  private oauth2Client;

  constructor() {
    // 2. Inicializamos el cliente usando las credenciales de tu archivo .env
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // La URI de redirección que configuramos
    );

    // 3. Le pasamos el token de actualización (se usará cuando completemos la Fase 2)
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  /**
   * Función para listar las plantillas disponibles (Ejemplo de uso general)
   */
  async listarPlantillas(idCarpeta: string) {
    try {
      // Usamos this.oauth2Client en lugar del antiguo método del bot
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      
      const respuesta = await drive.files.list({
        q: `'${idCarpeta}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
      });

      return respuesta.data.files;
    } catch (error) {
      console.error('Error al listar archivos:', error);
      throw new Error('Hubo un problema al intentar conectar con Google Drive.');
    }
  }

  /**
   * Función principal: Copiar plantilla y guardar en la Carpeta Maestra
   */
  async copiarPlantillaYGuardar(idPlantilla: string, nombreNuevoFormulario: string) {
    try {
      // Usamos this.oauth2Client para autenticarnos con tu correo
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      const idCarpetaDestino = process.env.CARPETA_MAESTRA_ID;

      if (!idCarpetaDestino) {
        throw new Error('No se ha configurado la CARPETA_MAESTRA_ID en el archivo .env');
      }

      // Hacemos la petición a Google para copiar el archivo
      const respuesta = await drive.files.copy({
        fileId: idPlantilla,
        requestBody: {
          name: nombreNuevoFormulario,
          parents: [idCarpetaDestino], // Se guardará en la carpeta de tu cuenta institucional
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