export const MAPEO_DEMOGRAFICO: Record<string, string[]> = {
  nombre: ['nombre', 'nombres y apellidos'],
  edad: ['edad', 'años'],
  genero: ['género', 'genero', 'sexo'],
  nivel_formativo: ['nivel formativo', 'grado académico', 'educación'],
  sede: ['sede', 'campus', 'ubicación'],
  carrera: ['carrera', 'programa'],
  organizacion: ['nombre de organización', 'nombre de la organización', 'organización', 'organizacion', 'institución', 'empresa'],
  asignatura: ['asignatura', 'ramo', 'módulo', 'modulo','curso', 'materia']
};

export const CAMPOS_BASE = Object.keys(MAPEO_DEMOGRAFICO);

export const ALIAS_ORDENADOS = Object.entries(MAPEO_DEMOGRAFICO)
  .flatMap(([clave, aliasArray]) => aliasArray.map(alias => ({ clave, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);