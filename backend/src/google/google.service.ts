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

  async copiarPlantillaYGuardar(idPlantilla: string, nombreNuevoFormulario: string, idCarpetaDestino: string) {
    try 
    {
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      if (!idCarpetaDestino) {
        throw new Error('No se ha proporcionado una carpeta de destino válida.');
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

  /**
   * Mueve un archivo específico a la papelera de Google Drive.
   */
  async enviarArchivoAPapelera(idArchivo: string): Promise<void> {
    try {
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      
      await drive.files.update({
        fileId: idArchivo,
        requestBody: {
          trashed: true,
        },
      });
    } catch (error) {
      console.error(`Aviso: No se pudo mover el archivo ${idArchivo} a la papelera (es posible que ya no exista).`);
    }
  }

  /**
   * Obtiene el diseño estructural de un formulario (títulos, preguntas y saltos de página).
   */
  async obtenerDisenoFormulario(idFormulario: string): Promise<any> {
    try {
      const formsApi = google.forms({ version: 'v1', auth: this.oauth2Client });
      const respuesta = await formsApi.forms.get({ formId: idFormulario });
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener el diseño del formulario:', error);
      throw new Error('No se pudo conectar con la estructura de Google Forms.');
    }
  }

  /**
   * Obtiene una respuesta específica enviada por un usuario.
   */
  async obtenerRespuestaEspecifica(idFormulario: string, idRespuesta: string): Promise<any> {
    try {
      const formsApi = google.forms({ version: 'v1', auth: this.oauth2Client });
      const respuesta = await formsApi.forms.responses.get({
        formId: idFormulario,
        responseId: idRespuesta,
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener la respuesta de Google Forms:', error);
      throw new Error('No se pudo recuperar la respuesta desde Google.');
    }
  }

  /**
   * Le dice a Google Forms que envíe una notificación a Pub/Sub
   * cada vez que alguien responda este formulario específico.
   */
  async activarVigilanciaRespuestas(idFormulario: string): Promise<any> {
    try {
      const formsApi = google.forms({ version: 'v1', auth: this.oauth2Client });
      
      
      const nombreTema = 'projects/sistema-procesos-as/topics/respuestas-datademy';

      const respuesta = await formsApi.forms.watches.create({
        formId: idFormulario,
        requestBody: {
          watch: {
            target: {
              topic: {
                topicName: nombreTema
              }
            },
            eventType: 'RESPONSES'
          }
        }
      });

      console.log(`Vigilancia activada para el formulario: ${idFormulario}`);
      return respuesta.data;
    } catch (error) {
      console.error('Error al activar el Watch en Google Forms:', error);
      throw new Error('No se pudo vincular el formulario con Pub/Sub.');
    }
  }

}