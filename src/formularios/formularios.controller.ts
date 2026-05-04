import { Controller, Post, Body, Patch, Param, Get} from '@nestjs/common';
import { FormulariosService } from './formularios.service';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';

@Controller('formularios')
export class FormulariosController {
  constructor(private readonly formulariosService: FormulariosService) {}

  // Usamos @Post porque estamos "enviando" datos nuevos al servidor
  @Post('crear')
  async crearNuevoProceso(@Body() datos: CrearProcesoDto) {
    // @Body atrapa la información enviada y NestJS la pasa automáticamente por tu DTO
    return await this.formulariosService.crearProceso(datos);
  }

  @Patch(':id') // El :id es un parámetro que recibiremos por la URL
  async actualizarProceso(
    @Param('id') id: string, 
    @Body() datos: ActualizarProcesoDto
  ) {
    return await this.formulariosService.actualizar(id, datos);
  }
  
  @Post(':id/vincular-formulario')
  async vincularFormulario(
    @Param('id') idProceso: string, 
    @Body('idPlantilla') idPlantilla: string,
    @Body('nombreNuevoFormulario') nombreNuevoFormulario: string,
    @Body('tipoFormulario') tipoFormulario: 'socios' | 'estudiantes',
  ) {
    return await this.formulariosService.crearYVincularFormulario(
      idProceso,
      idPlantilla,
      nombreNuevoFormulario,
      tipoFormulario
    );
  }

  @Get('listar')
  async listarProcesos() {
    return await this.formulariosService.obtenerTodosLosProcesos();
  }
  
}