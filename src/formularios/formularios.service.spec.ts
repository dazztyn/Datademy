import { Test, TestingModule } from '@nestjs/testing';
import { FormulariosService } from './formularios.service';

describe('FormulariosService', () => {
  let service: FormulariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormulariosService],
    }).compile();

    service = module.get<FormulariosService>(FormulariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
