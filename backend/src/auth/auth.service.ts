import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PerfilGoogle } from './interfaces/perfil-google.interface';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async validarUsuarioGoogle(perfilGoogle: PerfilGoogle) 
  {
    const { correo, nombre, avatarUrl, googleId } = perfilGoogle;

    let usuario = await this.usuariosService.buscarPorCorreo(correo);

    if (!usuario) {
      throw new UnauthorizedException(
        `Acceso denegado. El correo ${correo} no está registrado en Datademy. Por favor, contacta al profesor/administrador para que te dé acceso.`
      );
    }

    if (!usuario.googleId) {
      usuario = await this.usuariosService.vincularCuentaGoogle(String(usuario._id), {
        googleId,
        avatarUrl,
        nombre: usuario.nombre === 'Socia Comunitaria' ? nombre : usuario.nombre 
      });

      if (!usuario) {
        throw new UnauthorizedException('Hubo un error al vincular tu cuenta.');
      }
    }

    const payload = { 
      sub: usuario._id, 
      correo: usuario.correo, 
      rol: usuario.rol 
    };

    const jwt = this.jwtService.sign(payload);
    
    return {
      usuario: {
        nombre: usuario.nombre,
        correo: usuario.correo,
        avatarUrl: usuario.avatarUrl,
        rol: usuario.rol
      },
      tokens: {
        backendJwt: jwt,
        googleAccessToken: perfilGoogle.accessToken
      }
    };
  }
}