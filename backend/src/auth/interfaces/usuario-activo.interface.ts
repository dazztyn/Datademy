
export interface UsuarioActivo 
{
  userId: string;
  correo: string;
  rol: string;
}

export interface PerfilGoogle 
{
  googleId: string;
  correo: string;
  nombre: string;
  avatarUrl: string;
  accessToken: string;
}