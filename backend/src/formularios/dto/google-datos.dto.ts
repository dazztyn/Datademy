import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GoogleDatosDto {
  @IsString({ message: 'El ID del formulario debe ser un texto.' })
  @IsNotEmpty({ message: 'El ID del formulario es obligatorio.' })
  id_google_form!: string;

  @IsString({ message: 'El ID de la carpeta debe ser un texto.' })
  @IsNotEmpty({ message: 'El ID de la carpeta es obligatorio.' })
  id_carpeta_drive!: string;

  @IsString({ message: 'El nombre del formulario debe ser un texto.' })
  @IsOptional()
  nombre_formulario?: string;
}