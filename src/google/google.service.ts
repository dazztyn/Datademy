import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { join } from 'path';

@Injectable()
export class GoogleService {
  // 1. Configuramos la llave y los permisos (Scopes)
  private readonly KEY_PATH = join(process.cwd(), 'credenciales-google.json');
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/documents',
  ];

  // 2. Creamos el objeto de autenticación
  private auth = new google.auth.GoogleAuth({
    keyFile: this.KEY_PATH,
    scopes: this.SCOPES,
  });

  // Nueva función que recibe el ID de la carpeta
  async listarArchivosEnCarpeta(folderId: string) {
    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
      });

      const archivos = res.data.files;
      if (!archivos || archivos.length === 0) {
        return { 
          estado: 'vacio', 
          mensaje: 'La carpeta existe y tenemos acceso, pero no hay plantillas dentro.' 
        };
      }

      return {
        estado: 'exito',
        mensaje: `¡Éxito! Encontramos ${archivos.length} plantillas.`,
        archivos: archivos,
      };

    } catch (error: any) {
      // AQUÍ ESTÁ LA MEJORA: Capturamos el error específico de permisos
      if (error.code === 404 || error.message.includes('not found')) {
        return {
          estado: 'error_permisos',
          mensaje: '¡Ups! El sistema no puede ver esta carpeta. Asegúrate de compartirla con el correo del bot.'
        };
      }

      // Si es otro tipo de error, lo reportamos en la consola
      console.error('Error interno al buscar en Drive:', error);
      throw new Error('Hubo un problema de conexión con Google Drive.');
    }
  }

}