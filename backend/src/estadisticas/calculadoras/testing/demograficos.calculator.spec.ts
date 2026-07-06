import { DemograficosCalculator } from '../demograficos.calculator';
import { Estadistica, DatosRespondente } from '../../schemas/estadisticas.schema';
import { ConteoDemograficoRaw } from '../../interfaces/metricas.interface';

describe('DemograficosCalculator', () => {
  let calculator: DemograficosCalculator;

  beforeEach(() => {
    calculator = new DemograficosCalculator();
  });

  describe('calcularDistribucionGenero', () => {
    it('debería calcular la distribución de géneros y manejar valores por defecto', () => {
      const mockEstadisticas: Partial<Estadistica>[] = [
        { datos_respondente: { genero: 'Femenino' } as unknown as DatosRespondente },
        { datos_respondente: { genero: 'Femenino' } as unknown as DatosRespondente },
        { datos_respondente: { genero: 'Masculino' } as unknown as DatosRespondente },
        { datos_respondente: {} as unknown as DatosRespondente }, 
        {} 
      ];

      const resultado = calculator.calcularDistribucionGenero(mockEstadisticas);
      
      expect(resultado).toEqual(expect.arrayContaining([
        { genero: 'Femenino', cantidad: 2 },
        { genero: 'Masculino', cantidad: 1 },
        { genero: 'No especificado', cantidad: 2 }
      ]));
    });
  });

  describe('obtenerListaSociosComunitarios', () => {
    it('debería extraer organizaciones únicas y asignar "Anónimo" si falta el nombre', () => {
      const mockEstadisticas: Partial<Estadistica>[] = [
        { datos_respondente: { organizacion: 'Org A', nombre: 'Juan' } as unknown as DatosRespondente },
        { datos_respondente: { organizacion: 'Org A', nombre: 'Pedro' } as unknown as DatosRespondente }, 
        { datos_respondente: { organizacion: 'Org B' } as unknown as DatosRespondente }, 
        { datos_respondente: { organizacion: 'No especificada', nombre: 'Ana' } as unknown as DatosRespondente }, 
        {}
      ];

      const resultado = calculator.obtenerListaSociosComunitarios(mockEstadisticas);
      
      expect(resultado.length).toBe(2);
      expect(resultado.find(r => r.organizacion === 'Org A')!.nombre_responsable).toBe('Juan');
      expect(resultado.find(r => r.organizacion === 'Org B')!.nombre_responsable).toBe('Anónimo');
    });
  });

  describe('formatearDistribucionOptimizada', () => {
    it('debería mapear correctamente los datos crudos de Mongo', () => {
      const mockMongo: ConteoDemograficoRaw[] = [
        { _id: 'Femenino', cantidad: 10 },
        { _id: 'Masculino', cantidad: 5 }
      ];

      const resultado = calculator.formatearDistribucionOptimizada(mockMongo);
      
      expect(resultado).toEqual([
        { genero: 'Femenino', cantidad: 10 },
        { genero: 'Masculino', cantidad: 5 }
      ]);
    });
  });
});