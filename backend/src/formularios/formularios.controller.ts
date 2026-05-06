import { Controller, Post, Body, Patch, Param, Get, Delete} from '@nestjs/common';
import { FormulariosService } from './formularios.service';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
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

  @Post('configurar-carpeta-destino')
  async configurarCarpetaDestino(@Body('idCarpeta') idCarpeta: string) 
  {
    return await this.formulariosService.guardarCarpetaDestino(idCarpeta);
  }

  @Post('sincronizar-plantillas')
  async sincronizarPlantillas(@Body('idCarpeta') idCarpeta: string) 
  {
    return await this.orquestadorService.sincronizarCarpetaPlantillas(idCarpeta);
  }

  @Get('listar')
  async listarProcesos() {
    return await this.formulariosService.obtenerTodosLosProcesos();
  }

  @Get('plantillas')
  async obtenerPlantillas() 
  {
    return await this.formulariosService.obtenerPlantillasCacheadas();
  }
  
  @Delete(':id')
  async eliminarProceso(@Param('id') id: string) 
  {
    return await this.orquestadorService.eliminarProcesoCompleto(id);
  }

}