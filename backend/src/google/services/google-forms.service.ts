import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, forms_v1 } from 'googleapis';

@Injectable()
export class GoogleFormsService {
  private oauth2Client;
  private forms: forms_v1.Forms;

  constructor(private readonly configService: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'https://developers.google.com/oauthplayground'
    );

    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get<string>('GOOGLE_REFRESH_TOKEN'),
    });

    this.forms = google.forms({ version: 'v1', auth: this.oauth2Client });
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
    try {
      const parametros: forms_v1.Params$Resource$Forms$Responses$List = { formId: idFormulario };
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

  async activarVigilanciaRespuestas(idFormulario: string): Promise<any> {
    try {
      const nombreTema = `projects/${process.env.GOOGLE_PROJECT_ID}/topics/respuestas-datademy`;
      const respuesta = await this.forms.forms.watches.create({
        formId: idFormulario,
        requestBody: { watch: { target: { topic: { topicName: nombreTema } }, eventType: 'RESPONSES' } }
      });
      console.log(`Vigilancia activada para el formulario: ${idFormulario}`);
      return respuesta.data as forms_v1.Schema$Watch;
    } catch (error) {
      if (error instanceof Error) {
        const googleError = error as Error & { code?: number | string; status?: number };
        const mensajeDeError = googleError.message;
        const codigo = Number(googleError.code || googleError.status || 0);
        
        if (mensajeDeError.includes('already exists') || codigo === 400) {
          console.log(`[Google API] La vigilancia ya estaba activada para: ${idFormulario}. Omitiendo error.`);
          return { estado: 'ya_existia' };
        }
      }
      console.error('Error al activar el Watch en Google Forms:', error);
      throw new Error('No se pudo vincular el formulario con Pub/Sub.');
    }
  }
}