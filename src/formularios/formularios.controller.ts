import { Controller, Post, Body, Patch, Param, Get} from '@nestjs/common';
import { FormulariosService } from './formularios.service';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';
import { FormulariosOrquestadorService } from './Orquestador/formularios-orquestador.service';

@Controller('formularios')
export class FormulariosController {
  constructor
  (
    private readonly formulariosService: FormulariosService,
    private readonly orquestadorService: FormulariosOrquestadorService
  ) {}

  // Usamos @Post porque estamos "enviando" datos nuevos al servidor
  @Post('crear')
  async crearNuevoProceso(@Body() datos: CrearProcesoDto) {
    // @Body atrapa la información enviada y NestJS la pasa automáticamente por tu DTO
    return await this.formulariosService.crearProceso(datos);
  }

  @Patch(':idProceso') // El :id es un parámetro que recibiremos por la URL
  async actualizarProceso(
    @Param('idProceso') id: string, 
    @Body() datos: ActualizarProcesoDto
  ) {
    return await this.formulariosService.actualizar(id, datos);
  }
  
  @Post(':idProceso/vincular-formulario')
  async vincularFormulario(
    @Param('idProceso') idProceso: string, 
    @Body('idPlantilla') idPlantilla: string,
    @Body('nombreNuevoFormulario') nombreNuevoFormulario: string,
    @Body('tipoFormulario') tipoFormulario: 'socios' | 'estudiantes',
  ) {
    return await this.orquestadorService.crearYVincularFormulario(
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