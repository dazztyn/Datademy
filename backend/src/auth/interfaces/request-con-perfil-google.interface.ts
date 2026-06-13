import { Request } from 'express';
import { PerfilGoogle } from './perfil-google.interface';

export interface RequestConPerfilGoogle extends Request {
  user: PerfilGoogle;
}