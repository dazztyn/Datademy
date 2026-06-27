import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReportesConfigService } from './services/reportes-config.service';
import { ReportesDriveService } from './services/reportes-drive.service';
import { ReportesDocsService } from './services/reportes-docs.service';

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

      const imagenesSubidas = await this.driveService.subirImagenesEnLotes(imagenesAInsertar, 10);
      imagenesTemporalesIds = imagenesSubidas.map(img => img.imagenDrive.id);

      await this.docsService.aplicarCambios(nuevoDocId, imagenesSubidas, datosTexto);

      const nombreInforme = `Informe de Resultados - ${nombreCarrera} - ${new Date().toLocaleDateString()}`;
      
      return {
        estado: 'exito',
        idDocumento: nuevoDocId,
        nombreInforme: nombreInforme,
        url_informe: `https://docs.google.com/document/d/${nuevoDocId}/edit`
      };

    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException('Error al generar el informe: ' + err.message);
    } finally {
      await this.driveService.limpiarArchivosTemporales(imagenesTemporalesIds, 10);
    }
  }
}