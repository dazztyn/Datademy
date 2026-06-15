import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReportesConfigService } from './reportes-config.service';
import { ReportesDriveService } from './reportes-drive.service';
import { ReportesDocsService } from './reportes-docs.service';

@Injectable()
export class ReportesService {
  constructor(
    private readonly configService: ReportesConfigService,
    private readonly driveService: ReportesDriveService,
    private readonly docsService: ReportesDocsService
  ) {}

  async actualizarConfiguracion(usuarioId: string, idCarpeta?: string, idPlantilla?: string) {
    return await this.configService.actualizarConfiguracion(usuarioId, idCarpeta, idPlantilla);
  }

  async crearInformeAutomatizado(usuarioId: string, datosTexto: Record<string, string>, graficos: Record<string, string>, nombreCarrera: string = 'General') {
    let imagenesTemporalesIds: string[] = [];
    try 
    {
      const { plantillaId, carpetaDestinoId } = await this.configService.obtenerConfiguracion(usuarioId);
      
      const nuevoDocId = await this.driveService.copiarPlantillaEnDrive(plantillaId, carpetaDestinoId, nombreCarrera);
      
      const imagenesAInsertar = await this.docsService.identificarUbicacionGraficos(nuevoDocId, graficos);

      const imagenesSubidas = await this.driveService.subirImagenesEnLotes(imagenesAInsertar, 3);
      imagenesTemporalesIds = imagenesSubidas.map(img => img.imagenDrive.id);

      await this.docsService.aplicarCambios(nuevoDocId, imagenesSubidas, datosTexto);
      
      return {
        estado: 'exito',
        url_informe: `https://docs.google.com/document/d/${nuevoDocId}/edit`
      };

    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException('Error al generar el informe: ' + err.message);
    } finally {
      // 6. Drive limpia su basura
      await this.driveService.limpiarArchivosTemporales(imagenesTemporalesIds, 5);
    }
  }
}