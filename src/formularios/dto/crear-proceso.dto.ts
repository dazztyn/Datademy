// src/formularios/dto/crear-proceso.dto.ts
import { IsString, IsNumber, IsNotEmpty, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { GoogleDatosDto } from './google-datos.dto';

// 1. Creamos un sub-contrato para validar los datos de las carpetas de Google


// 2. Este es el contrato principal que revisará todo lo que envíe el usuario
export class CrearProcesoDto {
  
  @IsString({ message: 'El nombre del proceso debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'No puedes dejar el nombre del proceso vacío.' })
  nombre_proceso!: string;

  @IsNumber({}, { message: 'El año debe ser obligatoriamente un número (Ej: 2026).' })
  @IsNotEmpty({ message: 'El año es obligatorio.' })
  anio!: number;

  // ValidateNested revisa que el objeto interior también cumpla las reglas
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GoogleDatosDto) // Convierte los datos entrantes a nuestra clase GoogleDatosDto
  formulario_estudiantes!: GoogleDatosDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GoogleDatosDto)
  formulario_socios!: GoogleDatosDto;
}