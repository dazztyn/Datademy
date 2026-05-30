import type { Genero, NivelFormativo, Sede } from './alumno.ts'

export interface FiltrosAlumno {
  genero: Genero | ''
  nivelFormativo: NivelFormativo | ''
  sede: Sede | ''
  carrera: string
}