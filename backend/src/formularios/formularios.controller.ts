import { Controller, Post, Body, Param, Get, Delete, Query, UseGuards, Req, BadRequestException} from '@nestjs/common';
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

  @Post(':idProceso/vincular-existente')
  async vincularFormularioExistente(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Body('idGoogleForm') idGoogleForm: string,
    @Body('tipoFormulario') tipoFormulario: 'socios' | 'estudiantes'
  ) {
    return await this.orquestadorService.vincularFormularioExistente(
      req.user.userId,
      idProceso,
      idGoogleForm,
      tipoFormulario
    );
  }

  @Post(':idProceso/configurar-metadatos')
  async configurarMetadatos(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Body('tipoFormulario') tipoFormulario: 'socios' | 'estudiantes',
    @Body('nombresConstructos') nombresConstructos: string[],
    @Body('totalEsperados') totalEsperados: number
  ) {
    return await this.formulariosService.guardarMetadatosFormulario(
      req.user.userId,
      idProceso,
      tipoFormulario,
      nombresConstructos,
      totalEsperados
    );
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

  @Get(':idProceso/cantidad-constructos')
  async obtenerCantidadConstructos(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Query('tipo') tipoFormulario: 'estudiantes' | 'socios'
  ) {
    if (!tipoFormulario || (tipoFormulario !== 'estudiantes' && tipoFormulario !== 'socios')) {
      throw new BadRequestException('Debes especificar el tipo de formulario (?tipo=estudiantes o ?tipo=socios)');
    }

    return await this.orquestadorService.obtenerCantidadConstructos(
      req.user.userId,
      idProceso,
      tipoFormulario
    );
  }
  
  @Delete(':id')
  async eliminarProceso(@Req() req: RequestConUsuario, @Param('id') id: string) 
  {
    return await this.orquestadorService.eliminarProcesoCompleto(req.user.userId, id);
  }

}