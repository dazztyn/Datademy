import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  // Esta función recibe el paquete que armó el google.strategy.ts
  async validarUsuarioGoogle(perfilGoogle: any) {
    const { correo, nombre, avatarUrl, googleId } = perfilGoogle;

    console.log('-----------------------------------');
    console.log('El correo que mandó Google es:', `"${correo}"`);
    console.log('-----------------------------------');

    // buscar si el correo está en la bd
    let usuario = await this.usuariosService.buscarPorCorreo(correo);

    if (!usuario) {
      throw new UnauthorizedException(
        'Acceso denegado. Tu correo no está registrado en Datademy. Contacta a un administrador.'
      );
    }

    // 3. Si el usuario existe, pero es su primera vez entrando (no tiene googleId guardado) se actualizan los datos 
    if (!usuario.googleId) {
        usuario = await this.usuariosService.vincularCuentaGoogle(usuario._id, {
        googleId,
        avatarUrl,
        nombre: usuario.nombre === 'Socia Comunitaria' ? nombre : usuario.nombre 
      });

      if (!usuario) {
        throw new UnauthorizedException('Hubo un error al vincular tu cuenta con la base de datos.');
      }
    }

    // dar acceso
    const payload = { 
      sub: usuario._id, 
      correo: usuario.correo, 
      rol: usuario.rol 
    };
    
    const jwt = this.jwtService.sign(payload); //se firma el jwt

    return {
      usuario: {
        nombre: usuario.nombre,
        correo: usuario.correo,
        avatarUrl: usuario.avatarUrl,
        rol: usuario.rol
      },
      tokens: {
        backendJwt: jwt, 
        googleAccessToken: perfilGoogle.accessToken // para google picker
      }
    };
  }
}