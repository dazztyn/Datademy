import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FormulariosService } from './formularios.service';
import { Proceso } from './schemas/proceso.schema';
import { Plantilla } from './schemas/plantilla.schema';
import { Configuracion } from './schemas/configuracion.schema';
import { EstudianteEstrategia } from './estrategias/estudiante.estrategia';
import { SocioEstrategia } from './estrategias/socio.estrategia';

describe('FormulariosService', () => {
  let service: FormulariosService;

  const mockProcesoModelStatic = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  };
  const MockProcesoConstructor = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'mongo_id_proceso', ...dto }),
  }));
  Object.assign(MockProcesoConstructor, mockProcesoModelStatic);

  const mockConfigModelStatic = {
    findOne: jest.fn(),
  };
  const MockConfigConstructor = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'mongo_id_config', ...dto }),
  }));
  Object.assign(MockConfigConstructor, mockConfigModelStatic);

  const mockPlantillaModelStatic = {
    find: jest.fn(),
    deleteMany: jest.fn(),
    insertMany: jest.fn(),
  };
  const MockPlantillaConstructor = jest.fn();
  Object.assign(MockPlantillaConstructor, mockPlantillaModelStatic);

  const mockEstudianteEstrategia = { procesarFormulario: jest.fn() };
  const mockSocioEstrategia = { procesarFormulario: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormulariosService,
        { provide: getModelToken(Proceso.name), useValue: MockProcesoConstructor },
        { provide: getModelToken(Configuracion.name), useValue: MockConfigConstructor },
        { provide: getModelToken(Plantilla.name), useValue: MockPlantillaConstructor },
        { provide: EstudianteEstrategia, useValue: mockEstudianteEstrategia },
        { provide: SocioEstrategia, useValue: mockSocioEstrategia },
      ],
    }).compile();

    service = module.get<FormulariosService>(FormulariosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });
  
  describe('crearProceso', () => {
    it('debería crear un proceso nuevo y devolver sus datos básicos', async () => {
      const datosNuevoProceso = { nombre_proceso: 'Taller de Pruebas', anio: 2026 };
      const usuario_id = 'user_123';

      const resultado = await service.crearProceso(usuario_id, datosNuevoProceso as any);

      // Verificamos que se llamó al constructor de Mongoose con los datos + el usuario
      expect(MockProcesoConstructor).toHaveBeenCalledWith({ ...datosNuevoProceso, usuario_id });
      expect(resultado.datos.idProceso).toBe('mongo_id_proceso');
      expect(resultado.datos.nombreProceso).toBe('Taller de Pruebas');
    });
  });

  describe('obtenerTodosLosProcesos', () => {
    it('debería devolver la lista de procesos formateada para el frontend', async () => {
      const mockProcesosDb = [
        {
          toObject: () => ({
            _id: 'proc_1',
            nombre_proceso: 'Proceso 1',
            anio: 2026,
            formulario_estudiantes: { id_google_form: 'form_1' }
          })
        }
      ];

      mockProcesoModelStatic.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProcesosDb)
        })
      });

      const resultado = await service.obtenerTodosLosProcesos('user_123');

      expect(resultado.estado).toBe('exito');
      expect(resultado.procesos[0].idProceso).toBe('proc_1');
      expect(resultado.procesos[0].formularios.formulario_estudiantes?.id_google_form).toBe('form_1');
      expect(resultado.procesos[0].formularios.formulario_socios).toBeNull();
    });
  });
  
  describe('obtenerCarpetaDestino', () => {
    it('debería lanzar un error si el usuario no ha configurado una carpeta', async () => {
      mockConfigModelStatic.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null) // BD responde que no existe
      });

      await expect(service.obtenerCarpetaDestino('user_123'))
        .rejects.toThrow('No se ha configurado una carpeta de destino. Por favor, asigne una desde el panel principal.');
    });

    it('debería devolver el ID de la carpeta si está configurada', async () => {
      mockConfigModelStatic.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id_carpeta_destino_formularios: 'carpeta_drive_xyz' })
      });

      const resultado = await service.obtenerCarpetaDestino('user_123');
      expect(resultado).toBe('carpeta_drive_xyz');
    });
  });

});