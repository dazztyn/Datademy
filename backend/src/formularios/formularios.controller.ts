import { Controller, Post, Body, Patch, Param, Get, Delete, Query, UseGuards, Req} from '@nestjs/common';
import { FormulariosService } from './formularios.service';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { FormulariosOrquestadorService } from './Orquestador/formularios-orquestador.service';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActivo } from 'src/auth/interfaces/usuario-activo.interface';

interface RequestConUsuario extends Request 
{
  user: UsuarioActivo;
}

@Controller('formularios')
@UseGuards(AuthGuard('jwt'))
export class FormulariosController {
  constructor
  (
    private readonly formulariosService: FormulariosService,
    private readonly orquestadorService: FormulariosOrquestadorService
  ) {}

  @Post('crear')
  async crearNuevoProceso(@Req() req: RequestConUsuario, @Body() datos: CrearProcesoDto) 
  {
    return await this.formulariosService.crearProceso(req.user.userId, datos);
  }
  
  @Post(':idProceso/vincular-formulario')
  async vincularFormulario(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string, 
    @Body('idPlantilla') idPlantilla: string,
    @Body('nombreNuevoFormulario') nombreNuevoFormulario: string,
    @Body('tipoFormulario') tipoFormulario: 'socios' | 'estudiantes'
  ) {
    return await this.orquestadorService.crearYVincularFormulario(
      req.user.userId,
      idProceso,
      idPlantilla,
      nombreNuevoFormulario,
      tipoFormulario
    );
  }

  @Post('configurar-carpeta-destino')
  async configurarCarpetaDestino(@Req() req: RequestConUsuario, @Body('idCarpeta') idCarpeta: string) 
  {
    return await this.formulariosService.guardarCarpetaDestino(req.user.userId, idCarpeta);
  }

  @Post('sincronizar-plantillas')
  async sincronizarPlantillas(@Req() req: RequestConUsuario, @Body('idCarpeta') idCarpeta: string) 
  {
    return await this.orquestadorService.sincronizarCarpetaPlantillas(req.user.userId, idCarpeta);
  }

  @Get('listar')
  async listarProcesos(@Req() req: RequestConUsuario) {
    return await this.formulariosService.obtenerTodosLosProcesos(req.user.userId);
  }

  @Get('plantillas')
  async obtenerPlantillas(@Req() req: RequestConUsuario, @Query('tipo') tipo?: string) 
  {
    return await this.formulariosService.obtenerPlantillasCacheadas(req.user.userId, tipo);
  }
  
  @Delete(':id')
  async eliminarProceso(@Req() req: RequestConUsuario, @Param('id') id: string) 
  {
    return await this.orquestadorService.eliminarProcesoCompleto(req.user.userId, id);
  }

}