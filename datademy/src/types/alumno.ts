export type Genero = 'Femenino' | 'Masculino' | 'Otro'
export type NivelFormativo = 'Pregrado' | 'Postgrado' | 'Educación continua'
export type Sede = 'Coquimbo' | 'Antofagasta'

export interface Alumno {
  id: string
  edad: number
  genero: Genero
  nivelFormativo: NivelFormativo
  sede: Sede
  carrera: string
}