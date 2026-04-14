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

  // 3. Función para probar si podemos ver los archivos de Drive
  async probarConexion() {
    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      
      // Le pedimos a Google que nos de una lista de 5 archivos
      const res = await drive.files.list({
        pageSize: 5,
        fields: 'files(id, name)',
      });

      const archivos = res.data.files;

      if (!archivos || archivos.length === 0) {
        return { mensaje: 'Conectado con éxito, pero el Drive del robot está vacío. ¡Recuerda compartirle una carpeta!' };
      }

      return {
        mensaje: '¡Conexión exitosa! Estos son los archivos que ve el robot:',
        archivos: archivos,
      };
    } catch (error) {
      console.error('Error al conectar con Google:', error);
      throw new InternalServerErrorException('No se pudo conectar con Google Drive');
    }
  }
}