export const MAPEO_DEMOGRAFICO: Record<string, string[]> = {
  nombre: ['nombre', 'nombres y apellidos'],
  edad: ['edad', 'años'],
  genero: ['género', 'genero', 'sexo'],
  nivel_formativo: ['nivel formativo', 'grado académico', 'educación'],
  sede: ['sede', 'campus', 'ubicación'],
  carrera: ['carrera', 'programa'],
  organizacion: ['nombre de organización', 'nombre de la organización', 'organización', 'organizacion', 'institución', 'empresa']
};

export const CAMPOS_BASE = Object.keys(MAPEO_DEMOGRAFICO);