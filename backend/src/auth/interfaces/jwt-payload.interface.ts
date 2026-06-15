export interface JwtPayload {
  sub: string;
  correo: string;
  rol: string;
  iat?: number;
  exp?: number;
}