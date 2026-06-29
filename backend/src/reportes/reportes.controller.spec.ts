import { Test, TestingModule } from '@nestjs/testing';
import { ReportesController } from './reportes.controller';

describe('ReportesController', () => {
  let controller: ReportesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportesController],
    }).compile();

    controller = module.get<ReportesController>(ReportesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
