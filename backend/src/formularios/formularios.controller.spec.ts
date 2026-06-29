import { Test, TestingModule } from '@nestjs/testing';
import { FormulariosController } from './formularios.controller';

describe('FormulariosController', () => {
  let controller: FormulariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormulariosController],
    }).compile();

    controller = module.get<FormulariosController>(FormulariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
