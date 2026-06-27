import { Controller, Post, Body, Param, Get, Delete, Query, UseGuards, Req, BadRequestException} from '@nestjs/common';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { FormulariosOrquestadorService } from './Orquestador/formularios-orquestador.service';
import { AuthGuard } from '@nestjs/passport';
import { UsuarioActivo } from 'src/auth/interfaces/usuario-activo.interface';
import { TipoFormulario } from 'src/common/enum/tipo-formulario.enum';
import { ProcesosService } from './services/procesos.service';
import { PlantillasService } from './services/plantillas.service';
import { ConfiguracionesService } from './services/configuraciones.service';

interface RequestConUsuario extends Request 
{
  user: UsuarioActivo;
}

@Controller('formularios')
@UseGuards(AuthGuard('jwt'))
export class FormulariosController {
  constructor
  (
    private readonly procesosService: ProcesosService,
    private readonly plantillasService: PlantillasService,
    private readonly configuracionesService: ConfiguracionesService,
    private readonly orquestadorService: FormulariosOrquestadorService
  ) {}

  @Post('crear')
  async crearNuevoProceso(@Req() req: RequestConUsuario, @Body() datos: CrearProcesoDto) 
  {
    return await this.procesosService.crearProceso(req.user.userId, datos);
  }
  
  @Post(':idProceso/vincular-formulario')
  async vincularFormulario(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string, 
    @Body('idPlantilla') idPlantilla: string,
    @Body('nombreNuevoFormulario') nombreNuevoFormulario: string,
    @Body('tipoFormulario') tipoFormulario: TipoFormulario
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
    return await this.configuracionesService.guardarCarpetaDestino(req.user.userId, idCarpeta);
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
    @Body('tipoFormulario') tipoFormulario: TipoFormulario
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
    @Body('tipoFormulario') tipoFormulario: TipoFormulario,
    @Body('nombresConstructos') nombresConstructos: string[],
    @Body('totalEsperados') totalEsperados: number
  ) {
    return await this.procesosService.guardarMetadatosFormulario(
      req.user.userId,
      idProceso,
      tipoFormulario,
      nombresConstructos,
      totalEsperados
    );
  }

  @Get('listar')
  async listarProcesos(@Req() req: RequestConUsuario) {
    return await this.procesosService.obtenerTodosLosProcesos(req.user.userId);
  }

  @Get('plantillas')
  async obtenerPlantillas(@Req() req: RequestConUsuario, @Query('tipo') tipo?: string) 
  {
    return await this.plantillasService.obtenerPlantillasCacheadas(req.user.userId, tipo);
  }

  @Get(':idProceso/cantidad-constructos')
  async obtenerCantidadConstructos(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Query('tipo') tipoFormulario: TipoFormulario
  ) {
    if (!tipoFormulario || !Object.values(TipoFormulario).includes(tipoFormulario)) {
      throw new BadRequestException('Debes especificar el tipo de formulario (?tipo=estudiantes o ?tipo=socios)');
    }

    return await this.orquestadorService.obtenerCantidadConstructos(
      req.user.userId,
      idProceso,
      tipoFormulario
    );
  }
  
  @Get(':idProceso/metadatos')
  async obtenerMetadatos(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string
  ) {
    return await this.procesosService.obtenerMetadatosGuardados(req.user.userId, idProceso);
  }

  @Delete(':id')
  async eliminarProceso(@Req() req: RequestConUsuario, @Param('id') id: string) 
  {
    return await this.orquestadorService.eliminarProcesoCompleto(req.user.userId, id);
  }

  @Delete(':idProceso/desasignar/:tipoFormulario')
  async desasignarFormulario(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Param('tipoFormulario') tipoFormulario: string
  ) {
    
    const esTipoValido = tipoFormulario === TipoFormulario.ESTUDIANTES || tipoFormulario === TipoFormulario.SOCIOS;
    
    if (!esTipoValido) {
      throw new BadRequestException(`El parámetro debe ser exactamente '${TipoFormulario.ESTUDIANTES}' o '${TipoFormulario.SOCIOS}'.`);
    }

    return await this.procesosService.desasignarFormulario(
      req.user.userId, 
      idProceso, 
      tipoFormulario as TipoFormulario
    );
  }

  @Delete(':idProceso/informes/:idInformeDrive')
  async eliminarInforme(
    @Req() req: RequestConUsuario,
    @Param('idProceso') idProceso: string,
    @Param('idInformeDrive') idInformeDrive: string
  ) {
    if (!idProceso || !idInformeDrive) {
      throw new BadRequestException('Faltan parámetros requeridos para eliminar el informe.');
    }
    return await this.orquestadorService.eliminarInformeCompleto(req.user.userId, idProceso, idInformeDrive);
  }

}