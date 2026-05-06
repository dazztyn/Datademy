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

  @Post('crear')
  async crearNuevoProceso(@Body() datos: CrearProcesoDto) 
  {
    return await this.formulariosService.crearProceso(datos);
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

  @Post('sincronizar-plantillas')
  async sincronizarPlantillas(@Body('idCarpeta') idCarpeta: string) 
  {
    return await this.orquestadorService.sincronizarCarpetaPlantillas(idCarpeta);
  }

  @Get('plantillas')
  async obtenerPlantillas() 
  {
    return await this.formulariosService.obtenerPlantillasCacheadas();
  }
  
}