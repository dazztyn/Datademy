import { PartialType } from '@nestjs/mapped-types';
import { CrearProcesoDto } from './crear-proceso.dto';

// Esto hereda todo de CrearProcesoDto pero hace que todo sea opcional
export class ActualizarProcesoDto extends PartialType(CrearProcesoDto) {}