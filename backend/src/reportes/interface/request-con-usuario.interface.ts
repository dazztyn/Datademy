import { UsuarioActivo } from 'src/auth/interfaces/usuario-activo.interface';

export interface RequestConUsuario extends Request {
  user: UsuarioActivo;
}