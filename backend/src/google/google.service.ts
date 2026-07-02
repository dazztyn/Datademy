import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, forms_v1, drive_v3 } from 'googleapis';
import { ArchivoGoogleDrive } from './interfaces/archivo-google.interface';

@Injectable()
export class GoogleService 
{
  private oauth2Client;
  private drive: drive_v3.Drive;
  private forms: forms_v1.Forms;

  constructor(private readonly configService: ConfigService) 
  {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'https://developers.google.com/oauthplayground' 
    );

    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN'),
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.forms = google.forms({ version: 'v1', auth: this.oauth2Client });

  }

  async listarPlantillas(idCarpeta: string): Promise<ArchivoGoogleDrive[]> {
    try 
    { 
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
    try 
    {
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

  async enviarArchivoAPapelera(idArchivo: string): Promise<void> {
    try 
    {
      await this.drive.files.update({
        fileId: idArchivo,
        requestBody: {
          trashed: true,
        },
      });
    } catch (error) {
      console.error(`Aviso: No se pudo mover el archivo ${idArchivo} a la papelera (es posible que ya no exista).`);
    }
  }

  async obtenerDisenoFormulario(idFormulario: string): Promise<forms_v1.Schema$Form> {
    try {
      const respuesta = await this.forms.forms.get({ formId: idFormulario });
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener el diseño del formulario:', error);
      throw new Error('No se pudo conectar con la estructura de Google Forms.');
    }
  }

  async obtenerTodasLasRespuestas(idFormulario: string, ultimaSincronizacion?: Date): Promise<forms_v1.Schema$FormResponse[]> {
    try 
    {
      const parametros: forms_v1.Params$Resource$Forms$Responses$List = {
        formId: idFormulario,
      };

      if (ultimaSincronizacion) {
        parametros.filter = `timestamp > "${ultimaSincronizacion.toISOString()}"`;
      }

      const respuesta = await this.forms.forms.responses.list(parametros);

      return (respuesta.data.responses as forms_v1.Schema$FormResponse[]) || [];
    } catch (error) {
      console.error('Error al obtener las respuestas de Google Forms:', error);
      throw new Error('No se pudieron recuperar las respuestas desde Google.');
    }
  }

  /*async activarVigilanciaRespuestas(idFormulario: string): Promise<any> {
    try 
    {
      const nombreTema = `projects/${process.env.GOOGLE_PROJECT_ID}/topics/respuestas-datademy`;

      const respuesta = await this.forms.forms.watches.create({
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
      return respuesta.data as forms_v1.Schema$Watch;;
    } catch (error) {
      if (error instanceof Error) 
      {
        const googleError = error as Error & { code?: number | string; status?: number };
        const mensajeDeError = googleError.message;
        const codigo = Number(googleError.code || googleError.status || 0);
        
        if (mensajeDeError.includes('already exists') || codigo === 400) {
          console.log(`[Google API] La vigilancia ya estaba activada para el formulario: ${idFormulario}. Omitiendo error.`);
          return { estado: 'ya_existia' };
        }
      }
      console.error('Error al activar el Watch en Google Forms:', error);
      throw new Error('No se pudo vincular el formulario con Pub/Sub.');
    }
  }
  */

  async eliminarArchivoDrive(idArchivo: string): Promise<void> {
    try 
    {      
      await this.drive.files.delete({ fileId: idArchivo });
      console.log(`Archivo ${idArchivo} eliminado de Google Drive exitosamente.`);
    } catch (error: unknown) {
      console.warn(`Aviso: No se pudo eliminar el archivo de Drive (Quizás ya fue borrado manualmente). ID: ${idArchivo}`);
    }
  }

}