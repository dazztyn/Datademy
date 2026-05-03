import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  // El decorador @Param atrapa el ID que escribamos en la URL
  @Get('carpeta/:id') 
  async verCarpeta(@Param('id') folderId: string) {
    // Le pasamos el ID a nuestro servicio
    return await this.googleService.listarArchivosEnCarpeta(folderId);
  }

  @Post('copiar-plantilla')
  async copiarPlantilla(
    @Body('idPlantilla') idPlantilla: string,
    @Body('nombreNuevo') nombreNuevo: string,
  ) {
    // 1. Llamamos al servicio para hacer la copia
    const resultado = await this.googleService.copiarPlantillaYGuardar(idPlantilla, nombreNuevo);

    // 2. Construimos la URL de edición de Google Forms
    // Todas las URLs de edición siguen este patrón: /d/ID_DEL_ARCHIVO/edit
    const urlEdicion = `https://docs.google.com/forms/d/${resultado.nuevo_id_google_form}/edit`;

    return {
      ...resultado,
      url_edicion: urlEdicion // Enviamos la URL para que el Frontend redirija
    };
  }
}