import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('carpeta/:id') 
  async verCarpeta(@Param('id') folderId: string) 
  {
    return await this.googleService.listarPlantillas(folderId);
  }

  @Post('copiar-plantilla')
  async copiarPlantilla(
    @Body('idPlantilla') idPlantilla: string,
    @Body('nombreNuevo') nombreNuevo: string,
  ) {

    const resultado = await this.googleService.copiarPlantillaYGuardar(idPlantilla, nombreNuevo);

    const urlEdicion = `https://docs.google.com/forms/d/${resultado.nuevo_id_google_form}/edit`;

    return {
      ...resultado,
      url_edicion: urlEdicion
    };
  }
}