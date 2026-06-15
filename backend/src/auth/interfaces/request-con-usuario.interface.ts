import { UsuarioActivo } from "./usuario-activo.interface";

export interface RequestConUsuario extends Request 
{
  user: UsuarioActivo;
  cookies: Record<string, any>;
}