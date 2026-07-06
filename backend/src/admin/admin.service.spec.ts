import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getModelToken } from '@nestjs/mongoose';
import { Usuario } from '../usuarios/schemas/usuarios.schema';
import { Proceso } from '../formularios/schemas/proceso.schema';
import { Estadistica } from '../estadisticas/schemas/estadisticas.schema';
import { ConfiguracionReportes } from '../reportes/schemas/configuracion-reportes.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;

  const mockDeleteMany = { 
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }) 
  };



  class MockUsuarioModel {
    private data: Partial<Usuario>;

    public save: jest.Mock;

    constructor(dto: Partial<Usuario>) {
      this.data = dto;
      this.save = jest.fn().mockResolvedValue(this.data);
    }

    static find = jest.fn().mockReturnThis();
    static select = jest.fn();
    static findOne = jest.fn();
    static findById = jest.fn();
    static findByIdAndDelete = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getModelToken(Usuario.name), useValue: MockUsuarioModel },
        { provide: getModelToken(Proceso.name), useValue: mockDeleteMany },
        { provide: getModelToken(Estadistica.name), useValue: mockDeleteMany },
        { provide: getModelToken(ConfiguracionReportes.name), useValue: mockDeleteMany },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    
    jest.clearAllMocks(); 
  });

  describe('obtenerTodosLosUsuarios', () => {
    it('debería obtener la lista de usuarios excluyendo tokens', async () => {
      MockUsuarioModel.select.mockResolvedValueOnce([{ correo: 'a@a.com' }]);
      
      const resultado = await service.obtenerTodosLosUsuarios();
      
      expect(MockUsuarioModel.find).toHaveBeenCalled();
      expect(MockUsuarioModel.select).toHaveBeenCalledWith('-refresh_token -google_access_token');
      expect(resultado).toEqual([{ correo: 'a@a.com' }]);
    });
  });

  describe('agregarUsuario', () => {
    it('debería lanzar BadRequestException si el correo ya existe', async () => {
      MockUsuarioModel.findOne.mockResolvedValueOnce({ correo: 'test@test.com' });

      await expect(service.agregarUsuario('test@test.com', 'Juan'))
        .rejects.toThrow(BadRequestException);
    });

    it('debería guardar y retornar éxito si el usuario es nuevo', async () => {
      MockUsuarioModel.findOne.mockResolvedValueOnce(null);

      const resultado = await service.agregarUsuario('nuevo@test.com', 'Pedro');
      
      expect(resultado.estado).toBe('exito');
      expect(resultado.mensaje).toBe('Usuario agregado correctamente');
    });
    
    it('debería guardar al usuario con los parámetros personalizados de rol y activo', async () => {
      MockUsuarioModel.findOne.mockResolvedValueOnce(null);

      const resultado = await service.agregarUsuario('admin@test.com', 'Admin', 'admin', false);
      
      expect(resultado.estado).toBe('exito');
      expect(resultado.mensaje).toBe('Usuario agregado correctamente');
    });
  });

  describe('eliminarUsuarioYDatos', () => {
    it('debería lanzar BadRequestException si el admin intenta auto-eliminarse', async () => {
      await expect(service.eliminarUsuarioYDatos('admin123', 'admin123'))
        .rejects.toThrow(BadRequestException);
    });

    it('debería lanzar NotFoundException si el usuario a borrar no existe', async () => {
      MockUsuarioModel.findById.mockResolvedValueOnce(null);

      await expect(service.eliminarUsuarioYDatos('userFantasma', 'admin123'))
        .rejects.toThrow(NotFoundException);
    });

    it('debería eliminar el usuario y sus datos en cascada si todo es correcto', async () => {
      MockUsuarioModel.findById.mockResolvedValueOnce({ correo: 'borrar@test.com' });

      const resultado = await service.eliminarUsuarioYDatos('userReal', 'admin123');

      expect(mockDeleteMany.deleteMany).toHaveBeenCalledTimes(3); 
      expect(MockUsuarioModel.findByIdAndDelete).toHaveBeenCalledWith('userReal');
      
      expect(resultado.estado).toBe('exito');
      expect(resultado.detalles.respuestas_borradas).toBe(5); 
    });
  });
});