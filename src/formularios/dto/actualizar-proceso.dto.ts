import { PartialType } from '@nestjs/mapped-types';
import { CrearProcesoDto } from './crear-proceso.dto';

export class ActualizarProcesoDto extends PartialType(CrearProcesoDto) {}