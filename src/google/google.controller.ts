import { Controller, Get, Param } from '@nestjs/common';
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
}