
import { IsString, IsNumber, IsNotEmpty, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { GoogleDatosDto } from './google-datos.dto';

export class CrearProcesoDto {
  
  @IsString({ message: 'El nombre del proceso debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'No puedes dejar el nombre del proceso vacío.' })
  nombre_proceso!: string;

  @IsNumber({}, { message: 'El año debe ser obligatoriamente un número (Ej: 2026).' })
  @IsNotEmpty({ message: 'El año es obligatorio.' })
  anio!: number;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GoogleDatosDto) 
  formulario_estudiantes!: GoogleDatosDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GoogleDatosDto)
  formulario_socios!: GoogleDatosDto;
}