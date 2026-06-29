import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './schemas/usuarios.schema';

describe('UsuariosService', () => {
  let service: UsuariosService;

  // 1. Objeto con métodos estáticos de Mongoose (búsqueda y actualización)
  const mockUsuarioModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
  };

  // 2. Función constructora infalible para simular 'new this.usuarioModelo(datos)'
  const MockConstructorUsuario = jest.fn().mockImplementation((dto) => ({
    ...dto, // Copia los datos que le pasamos (ej. correo, rol)
    save: jest.fn().mockResolvedValue(dto), // Al hacer .save(), devuelve esos mismos datos
  }));

  // 3. Unimos los métodos estáticos al constructor
  Object.assign(MockConstructorUsuario, mockUsuarioModel);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getModelToken(Usuario.name),
          useValue: MockConstructorUsuario, // Usamos nuestro constructor a prueba de balas
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpiamos la memoria entre cada test
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('buscarPorCorreo', () => {
    it('debería retornar un usuario si el correo existe y está activo', async () => {
      const mockUser = { correo: 'test@ucn.cl', activo: true };
      
      mockUsuarioModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const resultado = await service.buscarPorCorreo('test@ucn.cl');
      
      expect(mockUsuarioModel.findOne).toHaveBeenCalledWith({ correo: 'test@ucn.cl', activo: true });
      expect(resultado).toEqual(mockUser);
    });

    it('debería retornar null si el usuario no existe', async () => {
      mockUsuarioModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const resultado = await service.buscarPorCorreo('noexiste@ucn.cl');
      expect(resultado).toBeNull();
    });
  });

  describe('crearUsuarioAutomatico', () => {
    it('debería asignar rol "estudiante" a correos @alumnos.ucn.cl', async () => {
      const perfilGoogle = {
        nombre: 'Estudiante Test',
        correo: 'estudiante@alumnos.ucn.cl',
        googleId: '123',
        avatarUrl: 'url'
      };

      const resultado = await service.crearUsuarioAutomatico(perfilGoogle);

      // Ahora sí, 'resultado' tendrá la información correcta
      expect(resultado.rol).toBe('estudiante');
      expect(resultado.correo).toBe(perfilGoogle.correo);
    });

    it('debería asignar rol "funcionario" a correos que no sean de alumnos', async () => {
      const perfilGoogle = {
        nombre: 'Profe Test',
        correo: 'profe@ucn.cl',
        googleId: '456',
        avatarUrl: 'url'
      };

      const resultado = await service.crearUsuarioAutomatico(perfilGoogle);

      expect(resultado.rol).toBe('funcionario');
    });
  });

  describe('vincularCuentaGoogle', () => {
    it('debería actualizar los datos de Google y mantener el nombre si es Socia Comunitaria', async () => {
      const mockActualizado = { _id: 'id1', googleId: '789', nombre: 'Socia Real' };
      
      mockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockActualizado),
      });

      const datosNuevos = { googleId: '789', avatarUrl: 'url', nombre: 'Socia Real' };
      const resultado = await service.vincularCuentaGoogle('id1', datosNuevos);

      expect(mockUsuarioModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'id1',
        datosNuevos,
        { returnDocument: 'after' }
      );
      expect(resultado).toEqual(mockActualizado);
    });
  });
});