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

    let usuario = await this.usuariosService.buscarPorCorreo(correo);

    
    if (!usuario) {
      // Verificamos si pertenece a la universidad
      const esDominioValido = correo.endsWith('@ucn.cl') || correo.endsWith('@alumnos.ucn.cl');

      if (esDominioValido) {
        console.log('Creando nuevo usuario institucional automáticamente...');
        usuario = await this.usuariosService.crearUsuarioAutomatico(perfilGoogle);
      } else {
        throw new UnauthorizedException(
          'Acceso denegado. Para ingresar a Datademy debes usar tu correo institucional.'
        );
      }
    }

    // Si el usuario ya existía desde antes, pero es su primera vez entrando (no tiene googleId)
    // (Por ejemplo, si los habías registrado manualmente por Postman)
    if (!usuario.googleId) {
      usuario = await this.usuariosService.vincularCuentaGoogle(usuario._id, {
        googleId,
        avatarUrl,
        nombre: usuario.nombre === 'Socia Comunitaria' ? nombre : usuario.nombre 
      });

      if (!usuario) {
        throw new UnauthorizedException('Hubo un error al vincular tu cuenta.');
      }
    }

    // jwt
    const payload = { 
      sub: usuario._id, 
      correo: usuario.correo, 
      rol: usuario.rol 
    };
    
    const jwt = this.jwtService.sign(payload);

    console.log('\n========= ¡TOKEN GENERADO CON ÉXITO! =========');
    console.log(jwt);

    // Devolvemos los tokens al AuthController
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