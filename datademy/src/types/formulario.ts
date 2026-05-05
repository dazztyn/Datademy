export interface FormularioDetalle {
  id_carpeta_drive: string
  id_google_form: string
  nombre_formulario: string
}

export interface Proceso {
  idProceso: string
  nombreProceso: string
  anio: string
  formularios: {
    formulario_estudiantes: FormularioDetalle | null
    formulario_socios: FormularioDetalle | null
  }
}

export interface ListarResponse {
  procesos: Proceso[]
}