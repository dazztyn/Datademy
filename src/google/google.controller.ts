import { Controller, Get } from '@nestjs/common';
import { GoogleService } from './google.service';

@Controller('google') // La URL empezará con /google
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('probar') // La URL final será /google/probar
  async probarDrive() {
    return await this.googleService.probarConexion();
  }
}