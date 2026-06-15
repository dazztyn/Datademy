import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usuariosService: jest.Mocked<UsuariosService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsuariosService = {
      buscarPorCorreo: jest.fn(),
      crearUsuarioAutomatico: jest.fn(),
      vincularCuentaGoogle: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuariosService = module.get(UsuariosService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('validarUsuarioGoogle', () => {
    
    it('debería denegar el acceso a correos que no sean institucionales (@ucn.cl o @alumnos.ucn.cl)', async () => {
      usuariosService.buscarPorCorreo.mockResolvedValue(null);

      const perfilGoogleIntruso = {
        correo: 'intruso@gmail.com',
        nombre: 'Usuario Intruso',
        googleId: '999',
        avatarUrl: 'url',
        accessToken: 'token_google_falso'
      };

      // Ejecución y Verificación: Esperamos que la función explote con un UnauthorizedException
      await expect(service.validarUsuarioGoogle(perfilGoogleIntruso))
        .rejects
        .toThrow(UnauthorizedException);

      // Verificamos que el sistema haya cortado el flujo y NUNCA haya intentado crearlo
      expect(usuariosService.crearUsuarioAutomatico).not.toHaveBeenCalled();
    });

    it('debería dejar pasar y crear a un usuario nuevo si su correo SÍ es institucional', async () => {
      usuariosService.buscarPorCorreo.mockResolvedValue(null);
      
      const perfilEstudiante = {
        correo: 'nuevo.alumno@alumnos.ucn.cl',
        nombre: 'Estudiante Nuevo',
        googleId: '123',
        avatarUrl: 'url',
        accessToken: 'token_google_valido'
      };

      const mockUsuarioCreado = {
        _id: 'mongo_id_1',
        correo: 'nuevo.alumno@alumnos.ucn.cl',
        nombre: 'Estudiante Nuevo',
        rol: 'estudiante',
        googleId: '123'
      };

      usuariosService.crearUsuarioAutomatico.mockResolvedValue(mockUsuarioCreado as any);
      jwtService.sign.mockReturnValue('mi_token_jwt_secreto');

      const resultado = await service.validarUsuarioGoogle(perfilEstudiante);
      
      expect(usuariosService.crearUsuarioAutomatico).toHaveBeenCalledWith(perfilEstudiante);
      
      // Verificamos que retorne los tokens correctamente
      expect(resultado.tokens.backendJwt).toBe('mi_token_jwt_secreto');
      expect(resultado.tokens.googleAccessToken).toBe('token_google_valido');
    });

  });
});